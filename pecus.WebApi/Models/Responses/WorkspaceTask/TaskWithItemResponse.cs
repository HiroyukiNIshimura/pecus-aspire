using Pecus.Libs.DB.Models.Enums;
using System.Collections.Generic;

namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// アイテム情報付きタスクレスポンス
/// タスク一覧でアイテムへのリンクを表示するために使用
/// </summary>
public class TaskWithItemResponse
{
    /// <summary>
    /// リスト内での一意なインデックス（フロントエンドのReact key用）
    /// </summary>
    public int ListIndex { get; init; }

    // ===== タスク情報 =====

    /// <summary>
    /// タスクID
    /// </summary>
    public required int TaskId { get; set; }

    /// <summary>
    /// タスクシーケンス番号（アイテム内の順序）
    /// </summary>
    public required int Sequence { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    public required string TaskContent { get; set; }

    /// <summary>
    /// タスク種類ID
    /// </summary>
    public int? TaskTypeId { get; set; }

    /// <summary>
    /// タスク種類コード
    /// </summary>
    public string? TaskTypeCode { get; set; }

    /// <summary>
    /// タスク種類名
    /// </summary>
    public string? TaskTypeName { get; set; }

    /// <summary>
    /// タスク種類アイコン
    /// </summary>
    public string? TaskTypeIcon { get; set; }

    /// <summary>
    /// 優先度
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 開始日時
    /// </summary>
    public DateTimeOffset? StartDate { get; set; }

    /// <summary>
    /// 期限日時
    /// </summary>
    public DateTimeOffset? DueDate { get; set; }

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
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; }

    // ===== アイテム情報 =====

    /// <summary>
    /// アイテムID
    /// </summary>
    public required int ItemId { get; set; }

    /// <summary>
    /// アイテムコード
    /// </summary>
    public required string ItemCode { get; set; }

    /// <summary>
    /// アイテム件名
    /// </summary>
    public required string ItemSubject { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public required string WorkspaceCode { get; set; }

    /// <summary>
    /// アイテムオーナーユーザーID
    /// </summary>
    public int ItemOwnerId { get; set; }

    /// <summary>
    /// アイテムオーナーユーザー名
    /// </summary>
    public string? ItemOwnerUsername { get; set; }

    /// <summary>
    /// アイテムオーナーアバターURL
    /// </summary>
    public string? ItemOwnerAvatarUrl { get; set; }

    /// <summary>
    /// アイテム担当ユーザーID
    /// </summary>
    public int? ItemAssigneeId { get; set; }

    /// <summary>
    /// アイテム担当ユーザー名
    /// </summary>
    public string? ItemAssigneeUsername { get; set; }

    /// <summary>
    /// アイテム担当アバターURL
    /// </summary>
    public string? ItemAssigneeAvatarUrl { get; set; }

    /// <summary>
    /// アイテムコミッターユーザーID
    /// </summary>
    public int? ItemCommitterId { get; set; }

    /// <summary>
    /// アイテムコミッターユーザー名
    /// </summary>
    public string? ItemCommitterUsername { get; set; }

    /// <summary>
    /// アイテムコミッターアバターURL
    /// </summary>
    public string? ItemCommitterAvatarUrl { get; set; }

    /// <summary>
    /// コメントタイプ別件数
    /// </summary>
    public Dictionary<TaskCommentType, int> CommentTypeCounts { get; set; } = new();
}