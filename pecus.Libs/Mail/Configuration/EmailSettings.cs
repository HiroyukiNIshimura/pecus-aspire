namespace Pecus.Libs.Mail.Configuration;

/// <summary>
/// メール送信に関する設定
/// </summary>
public class EmailSettings
{
    /// <summary>
    /// SMTPサーバーのホスト名
    /// </summary>
    public string SmtpHost { get; set; } = string.Empty;

    /// <summary>
    /// SMTPサーバーのポート番号
    /// </summary>
    public int SmtpPort { get; set; } = 587;

    /// <summary>
    /// SSL/TLSを使用するかどうか
    /// </summary>
    public bool UseSsl { get; set; } = true;

    /// <summary>
    /// 認証ユーザー名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// 認証パスワード
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// デフォルトの送信元メールアドレス
    /// </summary>
    public string FromEmail { get; set; } = string.Empty;

    /// <summary>
    /// デフォルトの送信元表示名
    /// </summary>
    public string FromName { get; set; } = string.Empty;

    /// <summary>
    /// テンプレートファイルのルートディレクトリ
    /// </summary>
    public string TemplateRootPath { get; set; } = "Mail/Templates";
}
