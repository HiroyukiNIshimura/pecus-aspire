using Hangfire.Dashboard;

namespace Pecus.Filters;

/// <summary>
/// Hangfireダッシュボードへのアクセスを全て許可するフィルター（開発環境専用）
/// </summary>
public class AllowAllDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        // 開発環境では全てのアクセスを許可
        return true;
    }
}
