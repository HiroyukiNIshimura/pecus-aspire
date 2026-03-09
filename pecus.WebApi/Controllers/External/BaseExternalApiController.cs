using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Pecus.Authentication;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Controllers.External;

/// <summary>
/// 外部公開API用の基底コントローラー
/// </summary>
/// <remarks>
/// APIキー認証を備えたコントローラーの基底クラスです。
/// 全ての外部公開APIコントローラーはこれを継承します。
/// アクションメソッド実行前にAPIキーの有効性をチェックし、
/// CurrentOrganizationId、CurrentApiKey などをアクション内で安全に利用できます。
/// </remarks>
[ApiController]
[Route("api/external")]
[Authorize(AuthenticationSchemes = ApiKeyAuthenticationOptions.SchemeName)]
[Produces("application/json")]
[Tags("ExternalAPI")]
public abstract class BaseExternalApiController : ControllerBase, IAsyncActionFilter
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger _logger;

    /// <summary>
    /// 現在認証されているAPIキーID
    /// </summary>
    protected int CurrentApiKeyId { get; private set; }

    /// <summary>
    /// 現在認証されているAPIキーが所属する組織ID
    /// </summary>
    protected int CurrentOrganizationId { get; private set; }

    /// <summary>
    /// 現在認証されているAPIキー（有効性確認済み）
    /// </summary>
    protected ExternalApiKey? CurrentApiKey { get; private set; }

    /// <summary>
    /// 現在認証されているAPIキーの組織（有効性確認済み）
    /// </summary>
    protected Organization? CurrentOrganization { get; private set; }

    protected BaseExternalApiController(
        ApplicationDbContext context,
        ILogger logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// アクション実行前に呼び出され、APIキーの有効性と組織情報を確認します
    /// </summary>
    [NonAction]
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        var startTime = DateTimeOffset.UtcNow;
        var ipAddress = GetClientIpAddress();

        try
        {
            // APIキーID取得
            var apiKeyIdClaim = User.FindFirst("api_key_id")?.Value;
            if (string.IsNullOrEmpty(apiKeyIdClaim) || !int.TryParse(apiKeyIdClaim, out var apiKeyId))
            {
                _logger.LogWarning("External API request without valid api_key_id claim. IP={IP}", ipAddress);
                context.Result = new UnauthorizedResult();
                return;
            }
            CurrentApiKeyId = apiKeyId;

            // 組織ID取得
            var organizationIdClaim = User.FindFirst("organization_id")?.Value;
            if (string.IsNullOrEmpty(organizationIdClaim) || !int.TryParse(organizationIdClaim, out var organizationId))
            {
                _logger.LogWarning("External API request without valid organization_id claim. IP={IP}", ipAddress);
                context.Result = new UnauthorizedResult();
                return;
            }
            CurrentOrganizationId = organizationId;

            // APIキーと組織情報を取得
            CurrentApiKey = await _context.ExternalApiKeys
                .Include(k => k.Organization)
                .AsNoTracking()
                .FirstOrDefaultAsync(k => k.Id == CurrentApiKeyId);

            if (CurrentApiKey == null)
            {
                _logger.LogWarning(
                    "External API request with non-existent API key: {ApiKeyId} IP={IP}",
                    CurrentApiKeyId,
                    ipAddress);
                context.Result = new UnauthorizedResult();
                return;
            }

            CurrentOrganization = CurrentApiKey.Organization;

            // リクエストログ（構造化ログ）
            _logger.LogInformation(
                "ExternalAPI Request: {Method} {Path} | ApiKeyId={ApiKeyId} OrgCode={OrgCode} KeyName={KeyName} IP={IP}",
                context.HttpContext.Request.Method,
                context.HttpContext.Request.Path,
                CurrentApiKeyId,
                CurrentOrganization.Code,
                CurrentApiKey.Name,
                ipAddress);

            // 次のアクションを実行
            var executedContext = await next();

            // レスポンスログ
            var elapsed = (DateTimeOffset.UtcNow - startTime).TotalMilliseconds;
            var statusCode = context.HttpContext.Response.StatusCode;

            _logger.LogInformation(
                "ExternalAPI Response: {StatusCode} in {ElapsedMs}ms | ApiKeyId={ApiKeyId} Path={Path}",
                statusCode,
                elapsed,
                CurrentApiKeyId,
                context.HttpContext.Request.Path);

            // エラー時は詳細ログ
            if (executedContext.Exception != null || statusCode >= 400)
            {
                _logger.LogWarning(
                    "ExternalAPI Error: {StatusCode} | ApiKeyId={ApiKeyId} Path={Path} Error={Error}",
                    statusCode,
                    CurrentApiKeyId,
                    context.HttpContext.Request.Path,
                    executedContext.Exception?.Message ?? "No exception");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error in External API authentication check. ApiKeyId={ApiKeyId} IP={IP}",
                CurrentApiKeyId,
                ipAddress);
            throw;
        }
    }

    /// <summary>
    /// クライアントのIPアドレスを取得します
    /// </summary>
    [NonAction]
    protected string GetClientIpAddress()
    {
        // X-Forwarded-For ヘッダーをチェック（プロキシ経由の場合）
        var forwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            return forwardedFor.Split(',').First().Trim();
        }

        // X-Real-IP ヘッダーをチェック（Nginxなどのプロキシ）
        var realIp = HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp))
        {
            return realIp;
        }

        // RemoteIpAddress を取得
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    /// <summary>
    /// 組織コードを取得します
    /// </summary>
    [NonAction]
    protected string GetOrganizationCode()
    {
        return CurrentOrganization?.Code ?? string.Empty;
    }
}
