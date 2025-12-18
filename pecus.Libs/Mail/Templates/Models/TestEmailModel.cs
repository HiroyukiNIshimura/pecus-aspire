namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// テストメールテンプレート用のモデル（開発用）
/// </summary>
public class TestEmailModel : IEmailTemplateModel<TestEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "test-email";

    /// <summary>
    /// 宛先メールアドレス
    /// </summary>
    public string Email { get; set; } = string.Empty;
}
