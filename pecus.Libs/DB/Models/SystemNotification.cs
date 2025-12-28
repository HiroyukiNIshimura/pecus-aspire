using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// システム通知エンティティ
/// </summary>
public class SystemNotification
{
    /// <summary>
    /// 通知ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 件名
    /// </summary>
    public required string Subject { get; set; }

    /// <summary>
    /// 本文（Markdown形式）
    /// </summary>
    public required string Body { get; set; }

    /// <summary>
    /// 通知種類
    /// </summary>
    public SystemNotificationType? Type { get; set; }

    /// <summary>
    /// 公開開始日時
    /// </summary>
    public required DateTimeOffset PublishAt { get; set; }

    /// <summary>
    /// 公開終了日時（null=無期限）
    /// </summary>
    public DateTimeOffset? EndAt { get; set; }

    /// <summary>
    /// 配信済みフラグ
    /// </summary>
    public bool IsProcessed { get; set; }

    /// <summary>
    /// 配信日時
    /// </summary>
    public DateTimeOffset? ProcessedAt { get; set; }

    /// <summary>
    /// 配信したChatMessageのID（JSON配列）
    /// </summary>
    public string? MessageIds { get; set; }

    /// <summary>
    /// 削除済みフラグ（論理削除）
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// 削除日時
    /// </summary>
    public DateTimeOffset? DeletedAt { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成者ユーザー
    /// </summary>
    public User? CreatedByUser { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// 更新者ユーザー
    /// </summary>
    public User? UpdatedByUser { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}
