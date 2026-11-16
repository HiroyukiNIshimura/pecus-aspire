namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// 新しい端末にパスキーを登録するリンクを送るメールテンプレート用のモデル
/// </summary>
public class CredentialDeviceLinkEmailModel
    : EmailTemplateModelBase,
        IEmailTemplateModel<CredentialDeviceLinkEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "passkey-device-link";

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// ログインID
    /// </summary>
    public string LoginId { get; set; } = string.Empty;

    /// <summary>
    /// 新しい端末で開くパスキー登録URL（端末追加チケットを含む）
    /// </summary>
    public string DeviceLinkUrl { get; set; } = string.Empty;

    /// <summary>
    /// リンクの有効期限
    /// </summary>
    public DateTimeOffset TokenExpiresAt { get; set; }

    /// <summary>
    /// 発行日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
