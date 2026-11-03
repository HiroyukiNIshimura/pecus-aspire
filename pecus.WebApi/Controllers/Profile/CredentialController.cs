using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Services;

namespace Pecus.Controllers.Profile;

/// <summary>
/// 自分のパスキー（WebAuthn クレデンシャル）管理コントローラー
/// </summary>
[Route("api/profile/credentials")]
[Tags("Profile")]
public class CredentialController : BaseSecureController
{
    private readonly WebAuthnCredentialService _credentialService;
    private readonly OrganizationAuthPolicyService _authPolicy;
    private readonly ILogger<CredentialController> _logger;

    public CredentialController(
        WebAuthnCredentialService credentialService,
        OrganizationAuthPolicyService authPolicy,
        ProfileService profileService,
        ILogger<CredentialController> logger
    ) : base(profileService, logger)
    {
        _credentialService = credentialService;
        _authPolicy = authPolicy;
        _logger = logger;
    }

    /// <summary>
    /// 登録済みパスキーの一覧を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<WebAuthnCredentialResponse>), StatusCodes.Status200OK)]
    public async Task<Ok<List<WebAuthnCredentialResponse>>> GetCredentials(
        CancellationToken cancellationToken)
    {
        var credentials = await _credentialService.GetCredentialsAsync(CurrentUserId, cancellationToken);
        return TypedResults.Ok(credentials);
    }

    /// <summary>
    /// パスキー登録用のオプションを取得
    /// </summary>
    [HttpPost("options")]
    [ProducesResponseType(typeof(WebAuthnRegistrationOptionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Ok<WebAuthnRegistrationOptionsResponse>> GetRegistrationOptions(
        CancellationToken cancellationToken)
    {
        await EnsureWebAuthnAllowedAsync(cancellationToken);

        if (CurrentUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        var response = await _credentialService.CreateRegistrationOptionsAsync(
            CurrentUser,
            cancellationToken);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// パスキーを登録
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WebAuthnCredentialResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<Ok<WebAuthnCredentialResponse>> Register(
        [FromBody] WebAuthnRegistrationRequest request,
        CancellationToken cancellationToken)
    {
        await EnsureWebAuthnAllowedAsync(cancellationToken);

        if (CurrentUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        var response = await _credentialService.RegisterAsync(CurrentUser, request, cancellationToken);

        _logger.LogInformation(
            "パスキーを登録しました。UserId: {UserId}, CredentialId: {CredentialId}",
            CurrentUserId,
            response.Id);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// パスキーの表示名を変更
    /// </summary>
    [HttpPatch("{credentialId:int}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Ok<MessageResponse>> Rename(
        int credentialId,
        [FromBody] WebAuthnCredentialNameRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _credentialService.RenameAsync(
            CurrentUserId,
            credentialId,
            request.Name,
            cancellationToken);

        if (!result)
        {
            throw new NotFoundException("パスキーが見つかりません。");
        }

        return TypedResults.Ok(new MessageResponse { Message = "パスキー名を変更しました。" });
    }

    /// <summary>
    /// パスキーを削除
    /// </summary>
    [HttpDelete("{credentialId:int}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Ok<MessageResponse>> Delete(
        int credentialId,
        CancellationToken cancellationToken)
    {
        var result = await _credentialService.DeleteAsync(
            CurrentUserId,
            credentialId,
            cancellationToken);

        if (!result)
        {
            throw new NotFoundException("パスキーが見つかりません。");
        }

        return TypedResults.Ok(new MessageResponse { Message = "パスキーを削除しました。" });
    }

    private async Task EnsureWebAuthnAllowedAsync(CancellationToken cancellationToken)
    {
        var mode = await _authPolicy.GetModeByUserIdAsync(CurrentUserId, cancellationToken);
        if (!OrganizationAuthPolicyService.AllowsWebAuthn(mode))
        {
            throw new InvalidOperationException("この組織ではパスキーを利用できません。");
        }
    }
}
