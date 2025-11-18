using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Pecus.Libs.Security;

/// <summary>
/// フロントエンドURLの検証と解決を行うユーティリティクラス
/// </summary>
/// <remarks>
/// Origin ヘッダーをホワイトリスト検証することで、フィッシング攻撃やオープンリダイレクト攻撃を防止します。
/// 複数のフロントエンド環境（開発、ステージング、本番）をサポートします。
/// </remarks>
public class FrontendUrlResolver
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FrontendUrlResolver> _logger;
    private readonly HashSet<string> _allowedOrigins;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="configuration">設定</param>
    /// <param name="logger">ロガー</param>
    public FrontendUrlResolver(IConfiguration configuration, ILogger<FrontendUrlResolver> logger)
    {
        _configuration = configuration;
        _logger = logger;

        // ホワイトリストを設定から読み込み
        var allowedUrls = _configuration
            .GetSection("Security:AllowedFrontendUrls")
            .Get<string[]>() ?? [];

        // 末尾のスラッシュを削除して正規化
        _allowedOrigins = allowedUrls
            .Select(url => url.TrimEnd('/'))
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        _logger.LogInformation(
            "FrontendUrlResolver initialized with {Count} allowed origins: {Origins}",
            _allowedOrigins.Count,
            string.Join(", ", _allowedOrigins)
        );
    }

    /// <summary>
    /// リクエストの Origin ヘッダーを検証し、ホワイトリストに含まれる場合はそのURLを返します
    /// </summary>
    /// <param name="httpContext">HTTPコンテキスト</param>
    /// <returns>検証済みのフロントエンドURL（末尾スラッシュなし）</returns>
    /// <exception cref="UnauthorizedAccessException">Origin ヘッダーがホワイトリストに含まれない場合</exception>
    public string GetValidatedFrontendUrl(HttpContext httpContext)
    {
        // 1. Origin ヘッダーを取得（ブラウザが自動設定、最も信頼できる）
        var origin = httpContext.Request.Headers.Origin.FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(origin))
        {
            var normalizedOrigin = origin.TrimEnd('/');

            if (_allowedOrigins.Contains(normalizedOrigin))
            {
                _logger.LogInformation(
                    "Origin header validated: {Origin}",
                    normalizedOrigin
                );
                return normalizedOrigin;
            }

            // ホワイトリストに含まれない Origin は拒否
            _logger.LogWarning(
                "Rejected Origin header (not in whitelist): {Origin}. Allowed origins: {AllowedOrigins}",
                normalizedOrigin,
                string.Join(", ", _allowedOrigins)
            );
            throw new UnauthorizedAccessException(
                $"フロントエンドURL '{normalizedOrigin}' は許可されていません。"
            );
        }

        // 2. Referer ヘッダーをフォールバック（メールリンクからのアクセス等）
        var referer = httpContext.Request.Headers.Referer.FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(referer) && Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
        {
            var refererOrigin = $"{refererUri.Scheme}://{refererUri.Host}";
            if (refererUri.Port != 80 && refererUri.Port != 443)
            {
                refererOrigin += $":{refererUri.Port}";
            }

            if (_allowedOrigins.Contains(refererOrigin))
            {
                _logger.LogInformation(
                    "Referer header validated: {Referer} (extracted origin: {Origin})",
                    referer,
                    refererOrigin
                );
                return refererOrigin;
            }

            _logger.LogWarning(
                "Rejected Referer header (not in whitelist): {Referer} (origin: {Origin})",
                referer,
                refererOrigin
            );
            throw new UnauthorizedAccessException(
                $"フロントエンドURL '{refererOrigin}' は許可されていません。"
            );
        }

        // 3. Origin/Referer が両方ともない場合はデフォルトURLを返す
        _logger.LogWarning(
            "Neither Origin nor Referer header found. Using default frontend URL."
        );
        return GetDefaultFrontendUrl();
    }

    /// <summary>
    /// デフォルトのフロントエンドURLを取得します
    /// </summary>
    /// <returns>ホワイトリストの最初のURL、またはフォールバック値</returns>
    public string GetDefaultFrontendUrl()
    {
        if (_allowedOrigins.Count > 0)
        {
            var defaultUrl = _allowedOrigins.First();
            _logger.LogInformation("Using default frontend URL: {Url}", defaultUrl);
            return defaultUrl;
        }

        // フォールバック（設定エラー時）
        const string fallback = "http://localhost:3000";
        _logger.LogWarning(
            "No allowed frontend URLs configured. Using fallback: {Fallback}",
            fallback
        );
        return fallback;
    }

    /// <summary>
    /// 指定されたURLがホワイトリストに含まれるか検証します
    /// </summary>
    /// <param name="url">検証対象のURL</param>
    /// <returns>ホワイトリストに含まれる場合 true</returns>
    public bool IsAllowedUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        var normalizedUrl = url.TrimEnd('/');
        return _allowedOrigins.Contains(normalizedUrl);
    }
}