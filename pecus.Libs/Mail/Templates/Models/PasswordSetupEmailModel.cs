namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// パスワード設定メールテンプレート用のモデル
/// </summary>
public class PasswordSetupEmailModel : EmailTemplateModelBase, IEmailTemplateModel<PasswordSetupEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "password-setup";

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// ログインID
    /// </summary>
    public string LoginId { get; set; } = string.Empty;

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
    public DateTimeOffset TokenExpiresAt { get; set; }

    /// <summary>
    /// アカウント作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}