using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Models.Responses.BackOffice;

/// <summary>
/// 組織の認証方式と、パスキー未登録ユーザーの状況
/// </summary>
public class BackOfficeOrganizationAuthStatusResponse
{
    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 現在の認証方式（null は既定値 = パスワードとパスキーの両方）
    /// </summary>
    public OrganizationAuthMode? AuthenticationMode { get; set; }

    /// <summary>
    /// 有効なユーザー数
    /// </summary>
    public int UserCount { get; set; }

    /// <summary>
    /// パスキー未登録の有効ユーザー数
    /// </summary>
    public int UsersWithoutCredential { get; set; }

    /// <summary>
    /// パスキー未登録の管理者ユーザー数
    /// </summary>
    public int AdminsWithoutCredential { get; set; }

    /// <summary>
    /// BackOffice 管理者が所属しているか（パスキー専用への変更を禁止する判定用）
    /// </summary>
    public bool HasBackOfficeUser { get; set; }
}
