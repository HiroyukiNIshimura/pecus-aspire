namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペースアイテムの添付ファイルエンティティ
/// </summary>
public class WorkspaceItemAttachment
{
    /// <summary>
    /// 添付ファイルID（主キー）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペースアイテムID（外部キー）
    /// </summary>
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// ワークスペースタスクID（外部キー、オプション）
    /// </summary>
    public int? WorkspaceTaskId { get; set; }

    /// <summary>
    /// ファイル名（元のファイル名）
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// ファイルサイズ（バイト単位）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// ファイルのMIMEタイプ
    /// </summary>
    public string MimeType { get; set; } = string.Empty;

    /// <summary>
    /// サーバー上のファイルパス（実際のストレージパス）
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// ダウンロード用のURL
    /// </summary>
    public string DownloadUrl { get; set; } = string.Empty;

    /// <summary>
    /// サムネイル（サイズM）のパス（画像ファイルの場合のみ）
    /// </summary>
    public string? ThumbnailMediumPath { get; set; }

    /// <summary>
    /// サムネイル（サイズS）のパス（画像ファイルの場合のみ）
    /// </summary>
    public string? ThumbnailSmallPath { get; set; }

    /// <summary>
    /// アップロード日時
    /// </summary>
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// アップロードしたユーザーID（外部キー）
    /// </summary>
    public int UploadedByUserId { get; set; }

    // Navigation Properties
    /// <summary>
    /// ワークスペースアイテム（ナビゲーションプロパティ）
    /// </summary>
    public WorkspaceItem? WorkspaceItem { get; set; }

    /// <summary>
    /// ワークスペースタスク（ナビゲーションプロパティ、オプション）
    /// </summary>
    public WorkspaceTask? WorkspaceTask { get; set; }

    /// <summary>
    /// アップロードしたユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User? UploadedByUser { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}