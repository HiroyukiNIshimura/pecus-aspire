namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// 組織登録完了メールテンプレート用のモデル
/// </summary>
public class OrganizationCreatedEmailModel : IEmailTemplateModel<OrganizationCreatedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "organization-created";

    /// <summary>
    /// 組織名
    /// </summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>
    /// 組織のメールアドレス
    /// </summary>
    public string OrganizationEmail { get; set; } = string.Empty;

    /// <summary>
    /// 代表者名
    /// </summary>
    public string RepresentativeName { get; set; } = string.Empty;

    /// <summary>
    /// 管理者ユーザー名
    /// </summary>
    public string AdminUserName { get; set; } = string.Empty;

    /// <summary>
    /// 管理者メールアドレス
    /// </summary>
    public string AdminEmail { get; set; } = string.Empty;

    /// <summary>
    /// 管理者ログインID
    /// </summary>
    public string AdminLoginId { get; set; } = string.Empty;

    /// <summary>
    /// パスワード設定URL（トークンを含む）
    /// </summary>
    public string PasswordSetupUrl { get; set; } = string.Empty;

    /// <summary>
    /// トークンの有効期限
    /// </summary>
    public DateTimeOffset TokenExpiresAt { get; set; }

    /// <summary>
    /// 組織作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}