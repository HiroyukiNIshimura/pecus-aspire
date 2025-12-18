namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// ウェルカムメールテンプレート用のモデル
/// </summary>
public class WelcomeEmailModel : IEmailTemplateModel<WelcomeEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "welcome";

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
    /// ワークスペース名（オプション）
    /// </summary>
    public string? WorkspaceName { get; set; }

    /// <summary>
    /// ログインURL
    /// </summary>
    public string LoginUrl { get; set; } = string.Empty;

    /// <summary>
    /// アカウント作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}