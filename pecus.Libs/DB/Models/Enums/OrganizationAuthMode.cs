namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// 組織で許可する認証方式
/// </summary>
public enum OrganizationAuthMode
{
    /// <summary>
    /// パスワードのみ
    /// </summary>
    Password = 0,

    /// <summary>
    /// パスキー（WebAuthn）のみ
    /// </summary>
    WebAuthn = 1,

    /// <summary>
    /// パスワードとパスキーの両方（移行期の既定値）
    /// </summary>
    Both = 2,
}
