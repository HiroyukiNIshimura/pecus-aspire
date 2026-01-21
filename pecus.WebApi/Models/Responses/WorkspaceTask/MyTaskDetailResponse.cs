using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

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
    /// ワークスペースモード（Normal/Document）
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<WorkspaceMode>))]
    public WorkspaceMode? WorkspaceMode { get; set; }

    /// <summary>
    /// アイテムコード
    /// </summary>
    public string? ItemCode { get; set; }

    /// <summary>
    /// アイテム件名
    /// </summary>
    public string? ItemSubject { get; set; }

    /// <summary>
    /// アイテムオーナー情報
    /// </summary>
    public UserIdentityResponse? ItemOwner { get; set; }

    /// <summary>
    /// アイテム担当者情報
    /// </summary>
    public UserIdentityResponse? ItemAssignee { get; set; }

    /// <summary>
    /// アイテムコミッター情報
    /// </summary>
    public UserIdentityResponse? ItemCommitter { get; set; }

    /// <summary>
    /// タスク作成者情報
    /// </summary>
    /// <value></value>
    public UserIdentityResponse? CreatedBy { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

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