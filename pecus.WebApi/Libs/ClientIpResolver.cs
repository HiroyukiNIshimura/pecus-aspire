namespace Pecus.Libs;

/// <summary>
/// リクエストからクライアントの IP アドレスを解決する
/// </summary>
public static class ClientIpResolver
{
    /// <summary>
    /// プロキシ経由を考慮してクライアント IP を取得する
    /// </summary>
    public static string? GetClientIpAddress(HttpContext? context)
    {
        if (context is null)
        {
            return null;
        }

        // X-Forwarded-For ヘッダーをチェック（プロキシ経由の場合）
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            // カンマ区切りで複数のIPが含まれる場合があるので、最初のものを取得
            return forwardedFor.Split(',').First().Trim();
        }

        // X-Real-IP ヘッダーをチェック（Nginxなどのプロキシ）
        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp))
        {
            return realIp;
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }
}
