namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// パスワードリセットメールテンプレート用のモデル
/// </summary>
public class PasswordResetEmailModel : IEmailTemplateModel<PasswordResetEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "password-reset";

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// パスワードリセットURL（トークンを含む）
    /// </summary>
    public string PasswordResetUrl { get; set; } = string.Empty;

    /// <summary>
    /// トークンの有効期限
    /// </summary>
    public DateTimeOffset TokenExpiresAt { get; set; }

    /// <summary>
    /// リクエスト日時
    /// </summary>
    public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;
}