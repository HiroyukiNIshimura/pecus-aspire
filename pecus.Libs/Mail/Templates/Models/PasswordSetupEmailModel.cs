namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// パスワード設定メールテンプレート用のモデル
/// </summary>
public class PasswordSetupEmailModel
{
    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 組織名
    /// </summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>
    /// パスワード設定URL（トークンを含む）
    /// </summary>
    public string PasswordSetupUrl { get; set; } = string.Empty;

    /// <summary>
    /// トークンの有効期限
    /// </summary>
    public DateTime TokenExpiresAt { get; set; }

    /// <summary>
    /// アカウント作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}