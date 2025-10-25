namespace Pecus.Libs.Mail.Models;

/// <summary>
/// メールメッセージ
/// </summary>
public class EmailMessage
{
    /// <summary>
    /// 宛先メールアドレス（複数可）
    /// </summary>
    public List<string> To { get; set; } = new();

    /// <summary>
    /// CCメールアドレス（複数可）
    /// </summary>
    public List<string> Cc { get; set; } = new();

    /// <summary>
    /// BCCメールアドレス（複数可）
    /// </summary>
    public List<string> Bcc { get; set; } = new();

    /// <summary>
    /// 送信元メールアドレス（指定しない場合は設定のデフォルト値を使用）
    /// </summary>
    public string? FromEmail { get; set; }

    /// <summary>
    /// 送信元表示名（指定しない場合は設定のデフォルト値を使用）
    /// </summary>
    public string? FromName { get; set; }

    /// <summary>
    /// 返信先メールアドレス
    /// </summary>
    public string? ReplyTo { get; set; }

    /// <summary>
    /// 件名
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// HTML形式の本文
    /// </summary>
    public string? HtmlBody { get; set; }

    /// <summary>
    /// テキスト形式の本文
    /// </summary>
    public string? TextBody { get; set; }

    /// <summary>
    /// 添付ファイル
    /// </summary>
    public List<EmailAttachment> Attachments { get; set; } = new();

    /// <summary>
    /// カスタムヘッダー
    /// </summary>
    public Dictionary<string, string> CustomHeaders { get; set; } = new();

    /// <summary>
    /// 優先度（1: 高, 3: 通常, 5: 低）
    /// </summary>
    public int Priority { get; set; } = 3;
}
