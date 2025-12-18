using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Pecus.Libs.Security;

/// <summary>
/// フロントエンドURLの解決を行うユーティリティクラス
/// </summary>
/// <remarks>
/// Aspire から設定される Frontend:Endpoint をベースURLとして使用します。
/// </remarks>
public class FrontendUrlResolver
{
    private readonly string _frontendEndpoint;
    private readonly ILogger<FrontendUrlResolver> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="configuration">設定</param>
    /// <param name="logger">ロガー</param>
    public FrontendUrlResolver(IConfiguration configuration, ILogger<FrontendUrlResolver> logger)
    {
        _logger = logger;

        // Frontend:Endpoint から読み込み（Aspire の .WithEnvironment("Frontend__Endpoint", ...) で設定）
        var endpoint = configuration["Frontend:Endpoint"];

        if (string.IsNullOrWhiteSpace(endpoint))
        {
            // フォールバック（設定エラー時）
            endpoint = "http://localhost:3000";
            _logger.LogWarning(
                "Frontend:Endpoint is not configured. Using fallback: {Fallback}",
                endpoint
            );
        }

        // 末尾のスラッシュを削除して正規化
        _frontendEndpoint = endpoint.TrimEnd('/');

        _logger.LogInformation(
            "FrontendUrlResolver initialized with endpoint: {Endpoint}",
            _frontendEndpoint
        );
    }

    /// <summary>
    /// フロントエンドのベースURLを取得します
    /// </summary>
    /// <returns>フロントエンドURL（末尾スラッシュなし）</returns>
    public string GetValidatedFrontendUrl()
    {
        return _frontendEndpoint;
    }

    /// <summary>
    /// フロントエンドのベースURLを取得します（後方互換性のため HttpContext パラメータを受け入れますが使用しません）
    /// </summary>
    /// <param name="httpContext">HTTPコンテキスト（未使用、後方互換性のため）</param>
    /// <returns>フロントエンドURL（末尾スラッシュなし）</returns>
    [Obsolete("HttpContext パラメータは不要になりました。GetValidatedFrontendUrl() を使用してください。")]
    public string GetValidatedFrontendUrl(Microsoft.AspNetCore.Http.HttpContext httpContext)
    {
        return _frontendEndpoint;
    }

    /// <summary>
    /// デフォルトのフロントエンドURLを取得します
    /// </summary>
    /// <returns>設定されたフロントエンドURL</returns>
    public string GetDefaultFrontendUrl()
    {
        return _frontendEndpoint;
    }

    /// <summary>
    /// 指定されたURLが設定されたフロントエンドURLと一致するか検証します
    /// </summary>
    /// <param name="url">検証対象のURL</param>
    /// <returns>一致する場合 true</returns>
    public bool IsAllowedUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        var normalizedUrl = url.TrimEnd('/');
        return string.Equals(_frontendEndpoint, normalizedUrl, StringComparison.OrdinalIgnoreCase);
    }
}