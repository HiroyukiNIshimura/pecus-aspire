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

    /// <summary>
    /// セットアップトークンによる登録であることを示す参照値
    /// </summary>
    public const string SetupReference = "setup";

    /// <summary>
    /// 管理者による認証情報リセットのセットアップトークンによる登録であることを示す参照値
    /// </summary>
    public const string ResetSetupReference = "reset-setup";

    /// <summary>
    /// 管理者による認証情報リセットで発行するセットアップトークンの接頭辞
    /// </summary>
    /// <remarks>
    /// URL 安全な Base64 トークンには含まれない「.」で終端することで、通常の招待トークンと一意に区別する。
    /// </remarks>
    public const string AdminResetSetupTokenPrefix = "admin-reset.";

    /// <summary>
    /// リカバリーコードによる登録であることを示す参照値の接頭辞
    /// </summary>
    public const string RecoveryReferencePrefix = "recovery:";

    /// <summary>
    /// リカバリートークン／セットアップ登録チャレンジの有効期限
    /// </summary>
    /// <remarks>
    /// 手動操作では画面を読んだり認証器の準備に時間がかかるため、5分では不足する。
    /// </remarks>
    public static readonly TimeSpan SetupTokenTtl = TimeSpan.FromMinutes(15);

    private const int ValidationTimeoutSeconds = 300;

    private readonly ApplicationDbContext _context;
    private readonly IFido2 _fido2;
    private readonly WebAuthnChallengeStore _challengeStore;
    private readonly OrganizationAuthPolicyService _authPolicy;
    private readonly RecoveryCodeService _recoveryCodes;
    private readonly RefreshTokenService _refreshTokens;
    private readonly SessionRevocationService _sessionRevocation;
    private readonly ILogger<WebAuthnCredentialService> _logger;

    public WebAuthnCredentialService(
        ApplicationDbContext context,
        IFido2 fido2,
        WebAuthnChallengeStore challengeStore,
        OrganizationAuthPolicyService authPolicy,
        RecoveryCodeService recoveryCodes,
        RefreshTokenService refreshTokens,
        SessionRevocationService sessionRevocation,
        ILogger<WebAuthnCredentialService> logger)
    {
        _context = context;
        _fido2 = fido2;
        _challengeStore = challengeStore;
        _authPolicy = authPolicy;
        _recoveryCodes = recoveryCodes;
        _refreshTokens = refreshTokens;
        _sessionRevocation = sessionRevocation;
        _logger = logger;
    }

    /// <summary>
    /// 件数上限の判定を免除する登録かどうか
    /// </summary>
    /// <remarks>
    /// 管理者リセットは登録完了時に既存パスキーを削除するため上限に達していても登録できる必要があり、
    /// リカバリーは認証器を失ったユーザーが復旧する唯一の手段のため、上限で妨げない。
    /// </remarks>
    private static bool IsRecoveryOrResetReference(string? reference) =>
        reference == ResetSetupReference
        || (reference?.StartsWith(RecoveryReferencePrefix, StringComparison.Ordinal) ?? false);

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
    /// パスキーログイン用のオプションを生成する
    /// </summary>
    public async Task<(WebAuthnLoginOptionsResponse Response, bool HasPasskey)> CreateLoginOptionsAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        var mode = await _authPolicy.GetModeByUserIdAsync(user.Id, cancellationToken);
        if (!OrganizationAuthPolicyService.AllowsWebAuthn(mode))
        {
            throw new UnauthorizedException("認証に失敗しました。");
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

        // チャレンジ発行後に組織がパスキーを禁止した場合に備え、検証時にも再確認する
        var mode = await _authPolicy.GetModeByUserIdAsync(user.Id, cancellationToken);
        if (!OrganizationAuthPolicyService.AllowsWebAuthn(mode))
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
        CancellationToken cancellationToken = default,
        string? reference = null)
    {
        await EnsureUserHandleAsync(user, cancellationToken);

        // 管理者リセットとリカバリーは復旧経路のため、上限に達していても登録を妨げない
        if (!IsRecoveryOrResetReference(reference))
        {
            var existingCount = await _context
                .UserCredentials
                .CountAsync(c => c.UserId == user.Id, cancellationToken);

            if (existingCount >= MaxCredentialsPerUser)
            {
                throw new InvalidOperationException(
                    $"パスキーは {MaxCredentialsPerUser} 件まで登録できます。不要なパスキーを削除してください。");
            }
        }

        var existing = await _context
            .UserCredentials
            .AsNoTracking()
            .Where(c => c.UserId == user.Id)
            .ToListAsync(cancellationToken);

        // リカバリー（認証器を失った想定）と管理者リセットでは既存クレデンシャルを除外しない。
        // 除外すると同じ認証器で再登録した際に InvalidStateError となり復旧できない。
        // 管理者リセットは登録完了時に既存パスキーを削除するため、除外する意味もない。
        var excludeCredentials = IsRecoveryOrResetReference(reference)
            ? new List<PublicKeyCredentialDescriptor>()
            : existing.Select(ToDescriptor).ToList();

        var options = _fido2.RequestNewCredential(new RequestNewCredentialParams
        {
            User = new Fido2User
            {
                Id = user.WebAuthnUserHandle!,
                Name = user.Email,
                DisplayName = user.Username,
            },
            ExcludeCredentials = excludeCredentials,
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
            cancellationToken,
            reference,
            reference is null ? null : SetupTokenTtl);

        return ToRegistrationOptionsResponse(options, challengeId);
    }

    /// <summary>
    /// セットアップトークンまたはリカバリートークンから登録用オプションを生成する（未認証）
    /// </summary>
    public async Task<WebAuthnRegistrationOptionsResponse> CreateSetupRegistrationOptionsAsync(
        string? setupToken,
        string? recoveryToken,
        CancellationToken cancellationToken = default)
    {
        string reference;
        User? user;

        if (!string.IsNullOrWhiteSpace(recoveryToken))
        {
            // ここでは消費しない（認証器の操作がキャンセルされた場合に再試行できるようにする）
            var recoveryEntry = await _challengeStore.PeekAsync(
                recoveryToken,
                WebAuthnChallengePurpose.Recovery);

            if (recoveryEntry?.UserId is null || recoveryEntry.Reference is null)
            {
                throw new UnauthorizedException(
                    "リカバリーの有効期限が切れています。リカバリーコードを入力し直してください。");
            }

            user = await _context
                .Users
                .FirstOrDefaultAsync(
                    u => u.Id == recoveryEntry.UserId.Value && u.IsActive,
                    cancellationToken);

            if (user is null)
            {
                throw new UnauthorizedException(
                    "リカバリーの有効期限が切れています。リカバリーコードを入力し直してください。");
            }

            // 登録成功時にリカバリートークンを失効させるため、ID を参照に含める
            reference = $"{recoveryEntry.Reference}:{recoveryToken}";
        }
        else if (!string.IsNullOrWhiteSpace(setupToken))
        {
            var now = DateTimeOffset.UtcNow;
            user = await _context
                .Users
                .FirstOrDefaultAsync(
                    u => u.CredentialSetupToken == setupToken
                         && u.CredentialSetupTokenExpiresAt > now
                         && u.IsActive,
                    cancellationToken);

            // 管理者による認証情報リセットの場合は、登録完了時に既存パスキーとセッションを失効させる
            reference = setupToken.StartsWith(AdminResetSetupTokenPrefix, StringComparison.Ordinal)
                ? ResetSetupReference
                : SetupReference;
        }
        else
        {
            throw new UnauthorizedException("パスキーの登録に失敗しました。");
        }

        if (user is null)
        {
            throw new UnauthorizedException("リンクが無効か期限切れです。");
        }

        var mode = await _authPolicy.GetModeByUserIdAsync(user.Id, cancellationToken);
        if (!OrganizationAuthPolicyService.AllowsWebAuthn(mode))
        {
            throw new UnauthorizedException("この組織ではパスキーを利用できません。");
        }

        return await CreateRegistrationOptionsAsync(user, cancellationToken, reference);
    }

    /// <summary>
    /// リカバリーコードを検証し、パスキー再登録用のトークンを発行する
    /// </summary>
    /// <returns>発行したリカバリートークン。識別子・コードが一致しない場合は null</returns>
    public async Task<string?> CreateRecoveryTokenAsync(
        string loginIdentifier,
        string code,
        CancellationToken cancellationToken = default)
    {
        var user = await FindUserByIdentifierAsync(loginIdentifier, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var mode = await _authPolicy.GetModeByUserIdAsync(user.Id, cancellationToken);
        if (!OrganizationAuthPolicyService.AllowsWebAuthn(mode))
        {
            return null;
        }

        var codeId = await _recoveryCodes.VerifyAsync(user.Id, code, cancellationToken);
        if (codeId is null)
        {
            return null;
        }

        return await _challengeStore.StoreAsync(
            string.Empty,
            WebAuthnChallengePurpose.Recovery,
            user.Id,
            cancellationToken,
            $"{RecoveryReferencePrefix}{codeId.Value}",
            SetupTokenTtl);
    }

    /// <summary>
    /// リカバリーコードを再発行する（認証済みユーザー）
    /// </summary>
    public Task<List<string>> IssueRecoveryCodesAsync(
        int userId,
        CancellationToken cancellationToken = default) =>
        _recoveryCodes.IssueAsync(userId, cancellationToken);

    /// <summary>
    /// 未使用のリカバリーコード数
    /// </summary>
    public Task<int> CountUnusedRecoveryCodesAsync(
        int userId,
        CancellationToken cancellationToken = default) =>
        _recoveryCodes.CountUnusedAsync(userId, cancellationToken);

    /// <summary>
    /// パスキー登録の応答を検証し、クレデンシャルを保存する（認証済みユーザー）
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

        var result = await CompleteRegistrationAsync(user, entry, request, cancellationToken);
        return result.Credential;
    }

    /// <summary>
    /// セットアップトークンまたはリカバリーコードでパスキーを登録する（未認証）
    /// </summary>
    public async Task<SetupRegistrationResult> RegisterWithSetupAsync(
        WebAuthnRegistrationRequest request,
        CancellationToken cancellationToken = default)
    {
        var entry = await _challengeStore.ConsumeAsync(
            request.ChallengeId,
            WebAuthnChallengePurpose.Registration);

        if (entry?.UserId is null)
        {
            throw new UnauthorizedException("パスキーの登録に失敗しました。");
        }

        var user = await _context
            .Users
            .FirstOrDefaultAsync(
                u => u.Id == entry.UserId.Value && u.IsActive,
                cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedException("パスキーの登録に失敗しました。");
        }

        // チャレンジ発行後に組織がパスキーを禁止した場合に備え、登録時にも再確認する
        var mode = await _authPolicy.GetModeByUserIdAsync(user.Id, cancellationToken);
        if (!OrganizationAuthPolicyService.AllowsWebAuthn(mode))
        {
            throw new UnauthorizedException("パスキーの登録に失敗しました。");
        }

        return await CompleteRegistrationAsync(user, entry, request, cancellationToken);
    }

    /// <summary>
    /// 登録結果（リカバリーコードの発行結果を含む）
    /// </summary>
    public sealed record SetupRegistrationResult(
        WebAuthnCredentialResponse Credential,
        List<string>? RecoveryCodes,
        string? RecoveryCodeInstruction,
        bool SessionsRevoked,
        int? UnusedRecoveryCodeCount);

    private async Task<SetupRegistrationResult> CompleteRegistrationAsync(
        User user,
        WebAuthnChallengeEntry entry,
        WebAuthnRegistrationRequest request,
        CancellationToken cancellationToken)
    {
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

        // 管理者リセットとリカバリーは復旧経路のため、上限に達していても登録を妨げない
        if (!IsRecoveryOrResetReference(entry.Reference))
        {
            var existingCount = await _context
                .UserCredentials
                .CountAsync(c => c.UserId == user.Id, cancellationToken);

            if (existingCount >= MaxCredentialsPerUser)
            {
                throw new InvalidOperationException(
                    $"パスキーは {MaxCredentialsPerUser} 件まで登録できます。不要なパスキーを削除してください。");
            }
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

        // 端末 ID はクライアント指定のため、自ユーザーの端末のみ紐づける。
        // 他ユーザーの端末を紐づけると、一覧での端末名参照や削除時のセッション失効の起点になる。
        // 該当しない場合は紐づけずに登録を継続する（認証器の操作を無駄にしない）。
        int? deviceId = null;
        if (request.DeviceId is int requestedDeviceId)
        {
            if (
                await _context.Devices.AnyAsync(
                    d => d.Id == requestedDeviceId && d.UserId == user.Id,
                    cancellationToken
                )
            )
            {
                deviceId = requestedDeviceId;
            }
            else
            {
                _logger.LogWarning(
                    "他ユーザーの、または存在しない端末 ID がパスキー登録に指定されました。UserId: {UserId}, DeviceId: {DeviceId}",
                    user.Id,
                    requestedDeviceId
                );
            }
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
            DeviceId = deviceId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _context.UserCredentials.Add(entity);

        // DB の変更はトランザクションでまとめる。Redis のチャレンジ／トークン消費や
        // セッション失効は DB トランザクションに参加せず、ロールバックでは取り消せない。
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "パスキーを登録しました。UserId: {UserId}, CredentialId: {CredentialId}, Reference: {Reference}",
                user.Id,
                entity.Id,
                entry.Reference ?? "(authenticated)");

            var (recoveryCodes, sessionsRevoked, unusedRecoveryCodeCount) = await ApplyPostRegistrationAsync(
                user,
                entity.Id,
                entry.Reference,
                cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return new SetupRegistrationResult(
                ToResponse(entity),
                recoveryCodes,
                recoveryCodes is null ? null : RecoveryCodeService.StorageInstruction,
                sessionsRevoked,
                unusedRecoveryCodeCount);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    /// <summary>
    /// 登録後の後処理（セットアップトークンの消費・リカバリーコードの使用と全セッション失効・コード再発行）
    /// </summary>
    /// <returns>
    /// 発行したリカバリーコード（発行しない場合は null）、全セッション失効の有無、未使用コード数
    /// </returns>
    private async Task<(List<string>? RecoveryCodes, bool SessionsRevoked, int? UnusedRecoveryCodeCount)>
        ApplyPostRegistrationAsync(
            User user,
            int newCredentialId,
            string? reference,
            CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(reference))
        {
            // 認証済みユーザーによる追加登録。
            // レスポンスでコードを返せないため、ここでは自動発行しない（明示的な再発行 API を使う）
            return (null, false, null);
        }

        if (reference == SetupReference)
        {
            user.CredentialSetupToken = null;
            user.CredentialSetupTokenExpiresAt = null;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            var issued = await _recoveryCodes.IssueAsync(user.Id, cancellationToken);
            return (issued, false, issued.Count);
        }

        if (reference == ResetSetupReference)
        {
            // 管理者による認証情報リセット。既存のパスキーとセッションを失効させる。
            user.CredentialSetupToken = null;
            user.CredentialSetupTokenExpiresAt = null;
            user.UpdatedAt = DateTimeOffset.UtcNow;

            await _context
                .UserCredentials
                .Where(c => c.UserId == user.Id && c.Id != newCredentialId)
                .ExecuteDeleteAsync(cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            await RevokeAllSessionsAsync(user.Id, cancellationToken);

            var issued = await _recoveryCodes.IssueAsync(user.Id, cancellationToken);
            return (issued, true, issued.Count);
        }

        if (reference.StartsWith(RecoveryReferencePrefix, StringComparison.Ordinal))
        {
            var parts = reference.Split(':', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2 || !int.TryParse(parts[1], out var codeId))
            {
                throw new UnauthorizedException("リカバリーコードが無効です。もう一度コードを入力してください。");
            }

            // 使用は 1 回限り。条件付き更新の結果で二重利用を判定する
            // （同時に複数リクエストが来ても成功するのは 1 件だけ）
            if (!await _recoveryCodes.MarkUsedAsync(codeId, cancellationToken))
            {
                _logger.LogWarning(
                    "使用済みのリカバリーコードが再利用されました。UserId: {UserId}, CodeId: {CodeId}",
                    user.Id,
                    codeId);
                throw new UnauthorizedException("このリカバリーコードは既に使用されています。");
            }

            // 登録が完了したのでリカバリートークンを失効させる。
            // 失効済みの場合もリカバリーコードの使用判定で二重利用は防げているため処理は続行する。
            if (parts.Length >= 3
                && await _challengeStore.ConsumeAsync(parts[2], WebAuthnChallengePurpose.Recovery) is null)
            {
                _logger.LogWarning(
                    "リカバリートークンは既に失効していました。UserId: {UserId}",
                    user.Id);
            }

            // 認証器を失った前提のため、他端末のセッションをすべて失効させる
            await RevokeAllSessionsAsync(user.Id, cancellationToken);

            // 残りのコードは使い続けられるようにし、使い切っていた場合のみ新規に発行する。
            // 残っているコードを毎回作り直すと、復旧のたびに保存し直す手間が発生し、
            // 「1 個使っても残りは有効」という案内とも矛盾するため。
            var remaining = await _recoveryCodes.CountUnusedAsync(user.Id, cancellationToken);
            if (remaining > 0)
            {
                _logger.LogInformation(
                    "リカバリー後、未使用のリカバリーコードを維持します。UserId: {UserId}, Remaining: {Remaining}",
                    user.Id,
                    remaining);
                return (null, true, remaining);
            }

            var issued = await _recoveryCodes.IssueAsync(user.Id, cancellationToken);
            return (issued, true, issued.Count);
        }

        return (null, false, null);
    }

    /// <summary>
    /// 全デバイスとセッション（リフレッシュトークン・JWT）を失効させる
    /// </summary>
    public Task RevokeAllSessionsAsync(int userId, CancellationToken cancellationToken = default) =>
        _sessionRevocation.RevokeAllSessionsAsync(userId, cancellationToken);

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
        var credential = await _context
            .UserCredentials
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == credentialId && c.UserId == userId, cancellationToken);

        if (credential is null)
        {
            return false;
        }

        // パスキー専用の組織でリカバリーコードも残っていない場合、最後の 1 件を削除すると
        // 管理者によるリセット以外にログイン手段が無くなるため拒否する
        var mode = await _authPolicy.GetModeByUserIdAsync(userId, cancellationToken);
        if (!OrganizationAuthPolicyService.AllowsPassword(mode))
        {
            var credentialCount = await _context.UserCredentials
                .CountAsync(c => c.UserId == userId, cancellationToken);
            var unusedCodeCount = await _recoveryCodes.CountUnusedAsync(userId, cancellationToken);

            if (credentialCount <= 1 && unusedCodeCount == 0)
            {
                throw new InvalidOperationException(
                    "最後のパスキーです。先にリカバリーコードを発行してから削除してください。");
            }
        }

        await _context
            .UserCredentials
            .Where(c => c.Id == credentialId && c.UserId == userId)
            .ExecuteDeleteAsync(cancellationToken);

        // 認証器を失った端末が紐づいている場合は、その端末のセッションも失効させる
        if (credential.DeviceId is int deviceId)
        {
            await RevokeDeviceSessionsAsync(userId, deviceId, cancellationToken);
        }

        _logger.LogInformation(
            "パスキーを削除しました。UserId: {UserId}, CredentialId: {CredentialId}",
            userId,
            credentialId);

        return true;
    }

    private async Task RevokeDeviceSessionsAsync(
        int userId,
        int deviceId,
        CancellationToken cancellationToken)
    {
        await _context
            .Devices
            .Where(d => d.Id == deviceId && d.UserId == userId && !d.IsRevoked)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(d => d.IsRevoked, true),
                cancellationToken);

        var tokens = await _context
            .RefreshTokens
            .AsNoTracking()
            .Where(t => t.DeviceId == deviceId && t.UserId == userId && !t.IsRevoked)
            .Select(t => t.Token)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            await _refreshTokens.RevokeRefreshTokenAsync(token);
        }
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
