using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Services;

/// <summary>
/// 組織ごとの認証方式ポリシーを解決する
/// </summary>
public class OrganizationAuthPolicyService
{
    /// <summary>
    /// 組織設定が未構成の場合に使用する認証方式
    /// </summary>
    public const OrganizationAuthMode DefaultMode = OrganizationAuthMode.Both;

    private readonly ApplicationDbContext _context;

    public OrganizationAuthPolicyService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// ユーザーが所属する組織の認証方式を取得する
    /// </summary>
    /// <remarks>
    /// ログイン処理は JWT 発行前のため、ユーザーIDから組織設定を引く。
    /// 設定行や組織が存在しない場合は <see cref="DefaultMode"/> を返す。
    /// </remarks>
    public async Task<OrganizationAuthMode> GetModeByUserIdAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var mode = await (
            from user in _context.Users.AsNoTracking()
            join setting in _context.OrganizationSettings.AsNoTracking()
                on user.OrganizationId equals (int?)setting.OrganizationId into settings
            from setting in settings.DefaultIfEmpty()
            where user.Id == userId
            select (OrganizationAuthMode?)setting.AuthenticationMode
        ).FirstOrDefaultAsync(cancellationToken);

        return mode ?? DefaultMode;
    }

    /// <summary>
    /// ユーザーIDから直接認証方式を取得する（ユーザー未特定時は既定値）
    /// </summary>
    public async Task<OrganizationAuthMode> GetModeByUserIdAsync(
        int? userId,
        CancellationToken cancellationToken = default)
    {
        if (userId is null)
        {
            return DefaultMode;
        }

        return await GetModeByUserIdAsync(userId.Value, cancellationToken);
    }

    /// <summary>
    /// パスワード認証を許可するか
    /// </summary>
    public static bool AllowsPassword(OrganizationAuthMode mode) => mode != OrganizationAuthMode.WebAuthn;

    /// <summary>
    /// パスキー（WebAuthn）認証を許可するか
    /// </summary>
    public static bool AllowsWebAuthn(OrganizationAuthMode mode) => mode != OrganizationAuthMode.Password;
}
