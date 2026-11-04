namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// パスキー登録メールテンプレート用のモデル
/// </summary>
public class CredentialSetupEmailModel : EmailTemplateModelBase, IEmailTemplateModel<CredentialSetupEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "passkey-setup";

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
    /// パスキー登録URL（トークンを含む）
    /// </summary>
    public string PasskeySetupUrl { get; set; } = string.Empty;

    /// <summary>
    /// トークンの有効期限
    /// </summary>
    public DateTimeOffset TokenExpiresAt { get; set; }

    /// <summary>
    /// 発行日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// リカバリーコードの保管案内
    /// </summary>
    public string RecoveryCodeInstruction { get; set; } = string.Empty;
}
