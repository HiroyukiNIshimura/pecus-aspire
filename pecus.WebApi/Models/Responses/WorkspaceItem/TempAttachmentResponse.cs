namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// 一時添付ファイルのレスポンス
/// </summary>
public class TempAttachmentResponse
{
    /// <summary>
    /// 一時ファイルID（UUID形式）
    /// </summary>
    public required string TempFileId { get; set; }

    /// <summary>
    /// セッションID
    /// </summary>
    public required string SessionId { get; set; }

    /// <summary>
    /// 元のファイル名
    /// </summary>
    public required string FileName { get; set; }

    /// <summary>
    /// ファイルサイズ（バイト）
    /// </summary>
    public required long FileSize { get; set; }

    /// <summary>
    /// MIMEタイプ
    /// </summary>
    public required string MimeType { get; set; }

    /// <summary>
    /// 一時ファイルのプレビューURL
    /// </summary>
    public required string PreviewUrl { get; set; }
}
