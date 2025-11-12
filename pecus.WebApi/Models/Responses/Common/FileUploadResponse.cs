namespace Pecus.Models.Responses.Common;

/// <summary>
/// ファイルアップロードレスポンス
/// </summary>
public class FileUploadResponse
{
    /// <summary>
    /// アップロード成功フラグ
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// ファイルURL（公開アクセス用）
    /// </summary>
    public string? FileUrl { get; set; }

    /// <summary>
    /// ファイルサイズ（バイト）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// ファイル形式
    /// </summary>
    public string? ContentType { get; set; }

    /// <summary>
    /// アップロード日時
    /// </summary>
    public DateTime UploadedAt { get; set; }

    /// <summary>
    /// メッセージ
    /// </summary>
    public string? Message { get; set; }
}

