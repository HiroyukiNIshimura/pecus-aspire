namespace Pecus.Libs.Mail.Models;

/// <summary>
/// メール添付ファイル
/// </summary>
public class EmailAttachment
{
    /// <summary>
    /// ファイル名
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// ファイルの内容（バイト配列）
    /// </summary>
    public byte[] Content { get; set; } = Array.Empty<byte>();

    /// <summary>
    /// MIMEタイプ
    /// </summary>
    public string ContentType { get; set; } = "application/octet-stream";

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public EmailAttachment() { }

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="fileName">ファイル名</param>
    /// <param name="content">ファイルの内容</param>
    /// <param name="contentType">MIMEタイプ</param>
    public EmailAttachment(
        string fileName,
        byte[] content,
        string contentType = "application/octet-stream"
    )
    {
        FileName = fileName;
        Content = content;
        ContentType = contentType;
    }
}