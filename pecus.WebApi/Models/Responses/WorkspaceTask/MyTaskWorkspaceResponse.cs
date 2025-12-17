using Pecus.Libs.DB.Models.Enums;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// マイタスクワークスペースレスポンス
/// ログインユーザーが担当のタスクを持つワークスペースの情報
/// </summary>
public record MyTaskWorkspaceResponse
{
    /// <summary>
    /// リスト内での一意なインデックス（フロントエンドのReact key用）
    /// </summary>
    public int ListIndex { get; init; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    public required int WorkspaceId { get; init; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public required string WorkspaceCode { get; init; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public required string WorkspaceName { get; init; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? GenreIcon { get; init; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public string? GenreName { get; init; }

    /// <summary>
    /// ワークスペースモード（Normal/Document）
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<WorkspaceMode>))]
    public WorkspaceMode? Mode { get; init; }

    /// <summary>
    /// 未完了タスク数
    /// </summary>
    public required int ActiveTaskCount { get; init; }

    /// <summary>
    /// 完了済みタスク数
    /// </summary>
    public required int CompletedTaskCount { get; init; }

    /// <summary>
    /// 期限超過タスク数
    /// </summary>
    public required int OverdueTaskCount { get; init; }

    /// <summary>
    /// ヘルプコメント数
    /// </summary>
    public required int HelpCommentCount { get; init; }

    /// <summary>
    /// 督促コメント数
    /// </summary>
    public required int ReminderCommentCount { get; init; }

    /// <summary>
    /// 最も古い期限日（ソート用、未完了タスクのみ対象）
    /// </summary>
    public DateTimeOffset? OldestDueDate { get; init; }
}