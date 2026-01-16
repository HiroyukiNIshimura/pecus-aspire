using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム添付ファイルレスポンス
/// </summary>
public class WorkspaceItemAttachmentResponse
{
    /// <summary>
    /// 添付ファイルID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ワークスペースアイテムID
    /// </summary>
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// ワークスペースタスクID（オプション）
    /// </summary>
    public int? WorkspaceTaskId { get; set; }

    /// <summary>
    /// ファイル名
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// ファイルサイズ（バイト）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// MIMEタイプ
    /// </summary>
    public string MimeType { get; set; } = string.Empty;

    /// <summary>
    /// ダウンロードURL
    /// </summary>
    public string DownloadUrl { get; set; } = string.Empty;

    /// <summary>
    /// サムネイル（サイズM）URL
    /// </summary>
    public string? ThumbnailMediumUrl { get; set; }

    /// <summary>
    /// サムネイル（サイズS）URL
    /// </summary>
    public string? ThumbnailSmallUrl { get; set; }

    /// <summary>
    /// アップロード日時
    /// </summary>
    public DateTimeOffset UploadedAt { get; set; }

    /// <summary>
    /// アップロードしたユーザーID
    /// </summary>
    public int UploadedByUserId { get; set; }

    /// <summary>
    /// アップロードしたユーザー名
    /// </summary>
    public string? UploadedByUsername { get; set; }

    /// <summary>
    /// タスク情報（オプション）
    /// </summary>
    public WorkspaceItemAttachmentTask? Task { get; set; }
}

public class WorkspaceItemAttachmentTask
{
    /// <summary>
    /// タスクシーケンス番号
    /// </summary>
    public int SequenceNumber { get; set; }
    /// <summary>
    /// タスク説明
    /// </summary>
    public string Content { get; set; } = string.Empty;
    /// <summary>
    /// タスク種別名
    /// </summary>
    public string TaskTypeName { get; set; } = string.Empty;
}