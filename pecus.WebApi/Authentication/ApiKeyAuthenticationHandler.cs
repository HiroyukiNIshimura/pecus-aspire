using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Pecus.Libs.DB.Services;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace Pecus.Authentication;

/// <summary>
/// APIキー認証スキームのオプション
/// </summary>
public class ApiKeyAuthenticationOptions : AuthenticationSchemeOptions
{
    /// <summary>
    /// 認証スキーム名
    /// </summary>
    public const string SchemeName = "ApiKey";

    /// <summary>
    /// APIキーを渡すHTTPヘッダー名
    /// </summary>
    public const string HeaderName = "X-API-KEY";
}

/// <summary>
/// APIキー認証ハンドラー
/// X-API-KEY ヘッダーからキーを取得し、DBのハッシュと照合して認証を行う。
/// </summary>
public class ApiKeyAuthenticationHandler(
    IOptionsMonitor<ApiKeyAuthenticationOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IServiceScopeFactory scopeFactory)
    : AuthenticationHandler<ApiKeyAuthenticationOptions>(options, logger, encoder)
{
    /// <inheritdoc />
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // ヘッダーからAPIキーを取得
        if (!Request.Headers.TryGetValue(ApiKeyAuthenticationOptions.HeaderName, out var apiKeyHeaderValues))
        {
            return AuthenticateResult.NoResult();
        }

        var providedApiKey = apiKeyHeaderValues.ToString();
        if (string.IsNullOrWhiteSpace(providedApiKey))
        {
            return AuthenticateResult.NoResult();
        }

        // Scoped サービスを解決するためスコープを作成
        using var scope = scopeFactory.CreateScope();
        var apiKeyService = scope.ServiceProvider.GetRequiredService<ExternalApiKeyService>();

        var entity = await apiKeyService.ValidateAsync(providedApiKey, Context.RequestAborted);
        if (entity is null)
        {
            return AuthenticateResult.Fail("Invalid or expired API key.");
        }

        // ClaimsPrincipal を構築
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, entity.Name),
            new Claim("api_key_id", entity.Id.ToString()),
            new Claim("organization_id", entity.OrganizationId.ToString()),
            new Claim("organization_code", entity.Organization?.Code ?? ""),
            new Claim("auth_scheme", ApiKeyAuthenticationOptions.SchemeName),
        };

        var identity = new ClaimsIdentity(claims, ApiKeyAuthenticationOptions.SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, ApiKeyAuthenticationOptions.SchemeName);

        return AuthenticateResult.Success(ticket);
    }
}