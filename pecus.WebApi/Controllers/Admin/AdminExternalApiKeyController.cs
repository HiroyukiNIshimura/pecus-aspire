using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.DB.Services;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// 外部公開API用のAPIキー管理コントローラー（組織管理者用）
/// </summary>
/// <remarks>
/// 組織ごとにAPIキーの発行・一覧取得・失効を管理します。
/// APIキーはSHA-256ハッシュとしてDBに保存され、平文は発行時のみ返却されます。
/// </remarks>
[Route("api/admin/external-api-keys")]
[Produces("application/json")]
[Tags("Admin - External API Keys")]
public class AdminExternalApiKeyController : BaseAdminController
{
    private readonly ExternalApiKeyService _apiKeyService;
    private readonly ILogger<AdminExternalApiKeyController> _logger;

    public AdminExternalApiKeyController(
        ExternalApiKeyService apiKeyService,
        ProfileService profileService,
        ILogger<AdminExternalApiKeyController> logger
    ) : base(profileService, logger)
    {
        _apiKeyService = apiKeyService;
        _logger = logger;
    }

    /// <summary>
    /// 自組織のAPIキー一覧を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ExternalApiKeyResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<ExternalApiKeyResponse>>> List(
        CancellationToken cancellationToken)
    {
        var keys = await _apiKeyService.ListAsync(CurrentOrganizationId, cancellationToken);

        var response = keys.Select(k => new ExternalApiKeyResponse
        {
            Id = k.Id,
            Name = k.Name,
            KeyPrefix = k.KeyPrefix,
            ExpiresAt = k.ExpiresAt,
            IsRevoked = k.IsRevoked,
            LastUsedAt = k.LastUsedAt,
            CreatedByUserId = k.CreatedByUserId,
            CreatedAt = k.CreatedAt,
            IsExpired = k.ExpiresAt < DateTimeOffset.UtcNow,
        }).ToList();

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// APIキーを新規発行
    /// </summary>
    /// <remarks>
    /// 平文キー（rawKey）はこのレスポンスでのみ取得可能です。
    /// 以降は先頭8文字（keyPrefix）のみ表示されます。
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(CreateExternalApiKeyResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<CreateExternalApiKeyResponse>> Create(
        [FromBody] CreateExternalApiKeyRequest request,
        CancellationToken cancellationToken)
    {
        var (entity, rawKey) = await _apiKeyService.CreateAsync(
            CurrentOrganizationId,
            CurrentUserId,
            request.Name,
            request.ExpirationDays,
            cancellationToken);

        var response = new CreateExternalApiKeyResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            KeyPrefix = entity.KeyPrefix,
            RawKey = rawKey,
            ExpiresAt = entity.ExpiresAt,
            CreatedAt = entity.CreatedAt,
        };

        return TypedResults.Created($"/api/admin/external-api-keys/{entity.Id}", response);
    }

    /// <summary>
    /// APIキーを失効させる
    /// </summary>
    /// <remarks>
    /// 失効したAPIキーは即座に無効化されます。この操作は取り消せません。
    /// </remarks>
    [HttpDelete("{keyId:int}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> Revoke(
        int keyId,
        CancellationToken cancellationToken)
    {
        await _apiKeyService.RevokeAsync(keyId, CurrentOrganizationId, cancellationToken);

        return TypedResults.Ok(new SuccessResponse
        {
            Message = "APIキーを失効させました。"
        });
    }
}
