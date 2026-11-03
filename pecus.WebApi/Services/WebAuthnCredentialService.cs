using System.Buffers.Text;
using System.Text.Json;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.User;
using Pecus.Models.Responses.User;

namespace Pecus.Services;

/// <summary>
/// パスキー（WebAuthn クレデンシャル）の登録・認証を担当する
/// </summary>
public class WebAuthnCredentialService
{
    /// <summary>
    /// 1 ユーザーあたりの最大登録数
    /// </summary>
    public const int MaxCredentialsPerUser = 10;

    private const int ValidationTimeoutSeconds = 300;

    private readonly ApplicationDbContext _context;
    private readonly IFido2 _fido2;
    private readonly WebAuthnChallengeStore _challengeStore;
    private readonly OrganizationAuthPolicyService _authPolicy;
    private readonly ILogger<WebAuthnCredentialService> _logger;

    public WebAuthnCredentialService(
        ApplicationDbContext context,
        IFido2 fido2,
        WebAuthnChallengeStore challengeStore,
        OrganizationAuthPolicyService authPolicy,
        ILogger<WebAuthnCredentialService> logger)
    {
        _context = context;
        _fido2 = fido2;
        _challengeStore = challengeStore;
        _authPolicy = authPolicy;
        _logger = logger;
    }

    /// <summary>
    /// ログイン識別子から有効なユーザーを取得する
    /// </summary>
    public async Task<User?> FindUserByIdentifierAsync(
        string loginIdentifier,
        CancellationToken cancellationToken = default)
    {
        return await _context
            .Users
            .Include(u => u.Roles)
            .Include(u => u.Setting)
            .FirstOrDefaultAsync(
                u => (u.Email == loginIdentifier || u.LoginId == loginIdentifier) && u.IsActive,
                cancellationToken);
    }

    /// <summary>
    /// ユーザーの登録済みパスキー一覧を取得する
    /// </summary>
    public async Task<List<WebAuthnCredentialResponse>> GetCredentialsAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var credentials = await _context
            .UserCredentials
            .AsNoTracking()
            .Include(c => c.Device)
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return credentials.Select(ToResponse).ToList();
    }

    /// <summary>
    /// ユーザーがパスキーを 1 件以上登録しているか
    /// </summary>
    public async Task<bool> HasCredentialAsync(
        int userId,
        CancellationToken cancellationToken = default) =>
        await _context.UserCredentials.AnyAsync(c => c.UserId == userId, cancellationToken);

    /// <summary>
    /// パスキーログイン用のオプションを生成する
    /// </summary>
    public async Task<(WebAuthnLoginOptionsResponse Response, bool HasPasskey)> CreateLoginOptionsAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        var mode = await _authPolicy.GetModeByUserIdAsync(user.Id, cancellationToken);
        if (!OrganizationAuthPolicyService.AllowsWebAuthn(mode))
        {
            throw new UnauthorizedException("この組織ではパスワード認証のみ利用できます。");
        }

        var credentials = await _context
            .UserCredentials
            .AsNoTracking()
            .Where(c => c.UserId == user.Id)
            .ToListAsync(cancellationToken);

        if (credentials.Count == 0)
        {
            // パスキー未登録。ユーザーの存在は秘匿し、呼び出し側で汎用エラーにする
            throw new UnauthorizedException("認証に失敗しました。");
        }

        var options = _fido2.GetAssertionOptions(new GetAssertionOptionsParams
        {
            AllowedCredentials = credentials.Select(ToDescriptor).ToList(),
            UserVerification = UserVerificationRequirement.Preferred,
        });

        var challengeId = await _challengeStore.StoreAsync(
            JsonSerializer.Serialize(options),
            WebAuthnChallengePurpose.Authentication,
            user.Id,
            cancellationToken);

        return (ToLoginOptionsResponse(options, challengeId), true);
    }

    /// <summary>
    /// パスキー認証の応答を検証する
    /// </summary>
    public async Task<User> VerifyLoginAsync(
        WebAuthnAssertionRequest request,
        CancellationToken cancellationToken = default)
    {
        var entry = await _challengeStore.ConsumeAsync(
            request.ChallengeId,
            WebAuthnChallengePurpose.Authentication);

        if (entry?.UserId is null)
        {
            throw new UnauthorizedException("認証に失敗しました。");
        }

        AssertionOptions originalOptions;
        try
        {
            originalOptions = JsonSerializer.Deserialize<AssertionOptions>(entry.Payload)
                ?? throw new UnauthorizedException("認証に失敗しました。");
        }
        catch (JsonException)
        {
            throw new UnauthorizedException("認証に失敗しました。");
        }

        var rawId = DecodeBase64Url(request.RawId);
        var credential = await _context
            .UserCredentials
            .FirstOrDefaultAsync(
                c => c.CredentialId == rawId && c.UserId == entry.UserId.Value,
                cancellationToken);

        if (credential is null)
        {
            throw new UnauthorizedException("認証に失敗しました。");
        }

        var user = await _context
            .Users
            .Include(u => u.Roles)
            .Include(u => u.Setting)
            .FirstOrDefaultAsync(u => u.Id == entry.UserId.Value && u.IsActive, cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedException("認証に失敗しました。");
        }

        VerifyAssertionResult result;
        try
        {
            result = await _fido2.MakeAssertionAsync(
                new MakeAssertionParams
                {
                    AssertionResponse = ToRawAssertionResponse(request),
                    OriginalOptions = originalOptions,
                    StoredPublicKey = credential.PublicKey,
                    StoredSignatureCounter = credential.SignCount,
                    // allowCredentials 指定時は UserHandle が空のことがあるため、空は許容する
                    IsUserHandleOwnerOfCredentialIdCallback = (args, _) =>
                        Task.FromResult(
                            args.UserHandle.Length == 0
                                || (user.WebAuthnUserHandle is { Length: > 0 } handle
                                    && args.UserHandle.SequenceEqual(handle))),
                },
                cancellationToken);
        }
        catch (Fido2VerificationException ex)
        {
            _logger.LogWarning(ex, "パスキー認証の検証に失敗しました。UserId: {UserId}", entry.UserId);
            throw new UnauthorizedException("認証に失敗しました。");
        }

        credential.SignCount = result.SignCount > credential.SignCount
            ? result.SignCount
            : credential.SignCount;
        credential.LastUsedAt = DateTimeOffset.UtcNow;
        user.LastLoginAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return user;
    }

    /// <summary>
    /// パスキー登録用のオプションを生成する
    /// </summary>
    public async Task<WebAuthnRegistrationOptionsResponse> CreateRegistrationOptionsAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        await EnsureUserHandleAsync(user, cancellationToken);

        var existingCount = await _context
            .UserCredentials
            .CountAsync(c => c.UserId == user.Id, cancellationToken);

        if (existingCount >= MaxCredentialsPerUser)
        {
            throw new InvalidOperationException(
                $"パスキーは {MaxCredentialsPerUser} 件まで登録できます。不要なパスキーを削除してください。");
        }

        var existing = await _context
            .UserCredentials
            .AsNoTracking()
            .Where(c => c.UserId == user.Id)
            .ToListAsync(cancellationToken);

        var options = _fido2.RequestNewCredential(new RequestNewCredentialParams
        {
            User = new Fido2User
            {
                Id = user.WebAuthnUserHandle!,
                Name = user.Email,
                DisplayName = user.Username,
            },
            ExcludeCredentials = existing.Select(ToDescriptor).ToList(),
            AuthenticatorSelection = new AuthenticatorSelection
            {
                // 同期パスキーを含む幅広い認証器を許可するため指定しない
                ResidentKey = ResidentKeyRequirement.Preferred,
                UserVerification = UserVerificationRequirement.Preferred,
            },
            AttestationPreference = AttestationConveyancePreference.None,
        });

        var challengeId = await _challengeStore.StoreAsync(
            JsonSerializer.Serialize(options),
            WebAuthnChallengePurpose.Registration,
            user.Id,
            cancellationToken);

        return ToRegistrationOptionsResponse(options, challengeId);
    }

    /// <summary>
    /// パスキー登録の応答を検証し、クレデンシャルを保存する
    /// </summary>
    public async Task<WebAuthnCredentialResponse> RegisterAsync(
        User user,
        WebAuthnRegistrationRequest request,
        CancellationToken cancellationToken = default)
    {
        var entry = await _challengeStore.ConsumeAsync(
            request.ChallengeId,
            WebAuthnChallengePurpose.Registration);

        if (entry?.UserId != user.Id)
        {
            throw new UnauthorizedException("パスキーの登録に失敗しました。");
        }

        CredentialCreateOptions originalOptions;
        try
        {
            originalOptions = JsonSerializer.Deserialize<CredentialCreateOptions>(entry.Payload)
                ?? throw new UnauthorizedException("パスキーの登録に失敗しました。");
        }
        catch (JsonException)
        {
            throw new UnauthorizedException("パスキーの登録に失敗しました。");
        }

        var existingCount = await _context
            .UserCredentials
            .CountAsync(c => c.UserId == user.Id, cancellationToken);

        if (existingCount >= MaxCredentialsPerUser)
        {
            throw new InvalidOperationException(
                $"パスキーは {MaxCredentialsPerUser} 件まで登録できます。不要なパスキーを削除してください。");
        }

        RegisteredPublicKeyCredential result;
        try
        {
            result = await _fido2.MakeNewCredentialAsync(
                new MakeNewCredentialParams
                {
                    AttestationResponse = ToRawAttestationResponse(request),
                    OriginalOptions = originalOptions,
                    IsCredentialIdUniqueToUserCallback = async (args, ct) =>
                        !await _context.UserCredentials.AnyAsync(
                            c => c.CredentialId == args.CredentialId,
                            ct),
                },
                cancellationToken);
        }
        catch (Fido2VerificationException ex)
        {
            _logger.LogWarning(ex, "パスキー登録の検証に失敗しました。UserId: {UserId}", user.Id);
            throw new InvalidOperationException("パスキーの登録に失敗しました。");
        }

        var entity = new UserCredential
        {
            UserId = user.Id,
            CredentialId = result.Id,
            PublicKey = result.PublicKey,
            SignCount = result.SignCount,
            Transports = result.Transports is { Length: > 0 }
                ? string.Join(",", result.Transports.Select(t => t.ToString().ToLowerInvariant()))
                : request.Response.Transports is { Count: > 0 }
                    ? string.Join(",", request.Response.Transports)
                    : null,
            Aaguid = result.AaGuid == Guid.Empty ? null : result.AaGuid,
            IsBackupEligible = result.IsBackupEligible,
            IsBackedUp = result.IsBackedUp,
            Name = string.IsNullOrWhiteSpace(request.Name) ? "パスキー" : request.Name.Trim(),
            DeviceId = request.DeviceId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _context.UserCredentials.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "パスキーを登録しました。UserId: {UserId}, CredentialId: {CredentialId}",
            user.Id,
            entity.Id);

        return ToResponse(entity);
    }

    /// <summary>
    /// パスキーの表示名を変更する
    /// </summary>
    public async Task<bool> RenameAsync(
        int userId,
        int credentialId,
        string name,
        CancellationToken cancellationToken = default)
    {
        var affected = await _context
            .UserCredentials
            .Where(c => c.Id == credentialId && c.UserId == userId)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(c => c.Name, name.Trim()),
                cancellationToken);

        return affected > 0;
    }

    /// <summary>
    /// パスキーを削除する
    /// </summary>
    public async Task<bool> DeleteAsync(
        int userId,
        int credentialId,
        CancellationToken cancellationToken = default)
    {
        var affected = await _context
            .UserCredentials
            .Where(c => c.Id == credentialId && c.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        if (affected > 0)
        {
            _logger.LogInformation(
                "パスキーを削除しました。UserId: {UserId}, CredentialId: {CredentialId}",
                userId,
                credentialId);
        }

        return affected > 0;
    }

    private async Task EnsureUserHandleAsync(User user, CancellationToken cancellationToken)
    {
        if (user.WebAuthnUserHandle is { Length: > 0 })
        {
            return;
        }

        user.WebAuthnUserHandle = System.Security.Cryptography.RandomNumberGenerator.GetBytes(16);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static PublicKeyCredentialDescriptor ToDescriptor(UserCredential credential)
    {
        var transports = string.IsNullOrWhiteSpace(credential.Transports)
            ? null
            : credential.Transports
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(ParseTransport)
                .OfType<AuthenticatorTransport>()
                .ToArray();

        return new PublicKeyCredentialDescriptor(
            PublicKeyCredentialType.PublicKey,
            credential.CredentialId,
            transports);
    }

    private static AuthenticatorTransport? ParseTransport(string value) =>
        Enum.TryParse<AuthenticatorTransport>(value, ignoreCase: true, out var transport)
            ? transport
            : null;

    private static AuthenticatorAssertionRawResponse ToRawAssertionResponse(
        WebAuthnAssertionRequest request) =>
        new()
        {
            Id = request.Id,
            RawId = DecodeBase64Url(request.RawId),
            Type = PublicKeyCredentialType.PublicKey,
            Response = new AuthenticatorAssertionRawResponse.AssertionResponse
            {
                AuthenticatorData = DecodeBase64Url(request.Response.AuthenticatorData),
                Signature = DecodeBase64Url(request.Response.Signature),
                ClientDataJson = DecodeBase64Url(request.Response.ClientDataJson),
                UserHandle = string.IsNullOrWhiteSpace(request.Response.UserHandle)
                    ? null
                    : DecodeBase64Url(request.Response.UserHandle),
            },
        };

    private static AuthenticatorAttestationRawResponse ToRawAttestationResponse(
        WebAuthnRegistrationRequest request) =>
        new()
        {
            Id = request.Id,
            RawId = DecodeBase64Url(request.RawId),
            Type = PublicKeyCredentialType.PublicKey,
            Response = new AuthenticatorAttestationRawResponse.AttestationResponse
            {
                AttestationObject = DecodeBase64Url(request.Response.AttestationObject),
                ClientDataJson = DecodeBase64Url(request.Response.ClientDataJson),
                Transports = request.Response.Transports?
                    .Select(ParseTransport)
                    .OfType<AuthenticatorTransport>()
                    .ToArray(),
            },
        };

    private static byte[] DecodeBase64Url(string value)
    {
        try
        {
            return Base64Url.DecodeFromChars(value);
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("認証情報の形式が不正です。");
        }
    }

    private WebAuthnLoginOptionsResponse ToLoginOptionsResponse(
        AssertionOptions options,
        string challengeId) =>
        new()
        {
            ChallengeId = challengeId,
            PublicKey = new WebAuthnRequestOptions
            {
                Challenge = Base64Url.EncodeToString(options.Challenge),
                RpId = options.RpId ?? string.Empty,
                Timeout = ValidationTimeoutSeconds * 1000L,
                UserVerification = options.UserVerification?.ToString().ToLowerInvariant(),
                AllowCredentials = options.AllowCredentials
                    .Select(c => new WebAuthnCredentialDescriptor
                    {
                        Id = Base64Url.EncodeToString(c.Id),
                        Type = "public-key",
                    })
                    .ToList(),
            },
        };

    private WebAuthnRegistrationOptionsResponse ToRegistrationOptionsResponse(
        CredentialCreateOptions options,
        string challengeId) =>
        new()
        {
            ChallengeId = challengeId,
            PublicKey = new WebAuthnCreationOptions
            {
                Rp = new WebAuthnRpEntity
                {
                    Id = options.Rp.Id,
                    Name = options.Rp.Name,
                },
                User = new WebAuthnUserEntity
                {
                    Id = Base64Url.EncodeToString(options.User.Id),
                    Name = options.User.Name,
                    DisplayName = options.User.DisplayName,
                },
                Challenge = Base64Url.EncodeToString(options.Challenge),
                Timeout = ValidationTimeoutSeconds * 1000L,
                Attestation = options.Attestation.ToString().ToLowerInvariant(),
                PubKeyCredParams = options.PubKeyCredParams
                    .Select(p => new WebAuthnCredentialParameter
                    {
                        Type = "public-key",
                        Alg = (int)p.Alg,
                    })
                    .ToList(),
                AuthenticatorSelection = options.AuthenticatorSelection is null
                    ? null
                    : new WebAuthnAuthenticatorSelection
                    {
                        AuthenticatorAttachment = options.AuthenticatorSelection.AuthenticatorAttachment
                            ?.ToString()
                            .ToLowerInvariant(),
                        ResidentKey = options.AuthenticatorSelection.ResidentKey.ToString().ToLowerInvariant(),
                        UserVerification = options.AuthenticatorSelection.UserVerification
                            .ToString()
                            .ToLowerInvariant(),
                    },
                ExcludeCredentials = options.ExcludeCredentials
                    .Select(c => new WebAuthnCredentialDescriptor
                    {
                        Id = Base64Url.EncodeToString(c.Id),
                        Type = "public-key",
                    })
                    .ToList(),
            },
        };

    private static WebAuthnCredentialResponse ToResponse(UserCredential credential) =>
        new()
        {
            Id = credential.Id,
            Name = credential.Name,
            CreatedAt = credential.CreatedAt,
            LastUsedAt = credential.LastUsedAt,
            IsBackupEligible = credential.IsBackupEligible,
            IsBackedUp = credential.IsBackedUp,
            DeviceId = credential.DeviceId,
            DeviceName = credential.Device?.Name,
            Transports = string.IsNullOrWhiteSpace(credential.Transports)
                ? new List<string>()
                : credential.Transports
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToList(),
        };
}
