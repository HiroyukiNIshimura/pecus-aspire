using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// ログインユーザーのタスク詳細レスポンス（アイテム情報含む）
/// </summary>
public class MyTaskDetailResponse
{
    /// <summary>
    /// タスクID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ワークスペースアイテムID
    /// </summary>
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string? WorkspaceCode { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public string? WorkspaceName { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? GenreIcon { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public string? GenreName { get; set; }

    /// <summary>
    /// アイテムコード
    /// </summary>
    public string? ItemCode { get; set; }

    /// <summary>
    /// アイテム件名
    /// </summary>
    public string? ItemSubject { get; set; }

    /// <summary>
    /// アイテムオーナーID
    /// </summary>
    public int? ItemOwnerId { get; set; }

    /// <summary>
    /// アイテムオーナー名
    /// </summary>
    public string? ItemOwnerUsername { get; set; }

    /// <summary>
    /// アイテムオーナーアバターURL
    /// </summary>
    public string? ItemOwnerAvatarUrl { get; set; }

    /// <summary>
    /// アイテム担当者ID
    /// </summary>
    public int? ItemAssigneeId { get; set; }

    /// <summary>
    /// アイテム担当者名
    /// </summary>
    public string? ItemAssigneeUsername { get; set; }

    /// <summary>
    /// アイテム担当者アバターURL
    /// </summary>
    public string? ItemAssigneeAvatarUrl { get; set; }

    /// <summary>
    /// アイテムコミッターID
    /// </summary>
    public int? ItemCommitterId { get; set; }

    /// <summary>
    /// アイテムコミッター名
    /// </summary>
    public string? ItemCommitterUsername { get; set; }

    /// <summary>
    /// アイテムコミッターアバターURL
    /// </summary>
    public string? ItemCommitterAvatarUrl { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 担当ユーザーID
    /// </summary>
    public int AssignedUserId { get; set; }

    /// <summary>
    /// 担当ユーザー名
    /// </summary>
    public string? AssignedUsername { get; set; }

    /// <summary>
    /// 担当ユーザーアバターURL
    /// </summary>
    public string? AssignedAvatarUrl { get; set; }

    /// <summary>
    /// 作成ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成ユーザー名
    /// </summary>
    public string? CreatedByUsername { get; set; }

    /// <summary>
    /// 作成ユーザーアバターURL
    /// </summary>
    public string? CreatedByAvatarUrl { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// タスク種類ID
    /// </summary>
    public int TaskTypeId { get; set; }

    /// <summary>
    /// タスク種類コード（例: "Bug", "Feature"）
    /// </summary>
    public string? TaskTypeCode { get; set; }

    /// <summary>
    /// タスク種類名（日本語表示名）
    /// </summary>
    public string? TaskTypeName { get; set; }

    /// <summary>
    /// タスク種類アイコン（拡張子なしのファイル名）
    /// </summary>
    public string? TaskTypeIcon { get; set; }

    /// <summary>
    /// 優先度（NULL の場合は Medium として扱う）
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 開始日時
    /// </summary>
    public DateTimeOffset? StartDate { get; set; }

    /// <summary>
    /// 期限日時（必須）
    /// </summary>
    public DateTimeOffset DueDate { get; set; }

    /// <summary>
    /// 予定工数（時間）
    /// </summary>
    public decimal? EstimatedHours { get; set; }

    /// <summary>
    /// 実績工数（時間）
    /// </summary>
    public decimal? ActualHours { get; set; }

    /// <summary>
    /// 進捗率（0-100）
    /// </summary>
    public int ProgressPercentage { get; set; }

    /// <summary>
    /// 完了フラグ
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// タスク完了日時
    /// </summary>
    public DateTimeOffset? CompletedAt { get; set; }

    /// <summary>
    /// 破棄状態
    /// </summary>
    public bool IsDiscarded { get; set; }

    /// <summary>
    /// 破棄日時
    /// </summary>
    public DateTimeOffset? DiscardedAt { get; set; }

    /// <summary>
    /// 破棄理由
    /// </summary>
    public string? DiscardReason { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>
    /// コメント数
    /// </summary>
    public int CommentCount { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}
