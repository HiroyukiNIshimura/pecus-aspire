using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Dashboard;

/// <summary>
/// ホットワークスペース統計レスポンス
/// タスク関連アクティビティが活発なワークスペースのランキング
/// </summary>
public class DashboardHotWorkspacesResponse
{
    /// <summary>
    /// 集計期間（"24h" または "1week"）
    /// </summary>
    [Required]
    public required string Period { get; set; }

    /// <summary>
    /// ホットワークスペースリスト（タスク関連アクティビティ数の多い順）
    /// </summary>
    [Required]
    public required List<HotWorkspaceEntry> Workspaces { get; set; }
}

/// <summary>
/// ホットワークスペースのエントリ
/// </summary>
public class HotWorkspaceEntry
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    [Required]
    public required int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    [Required]
    public required string WorkspaceCode { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    [Required]
    public required string WorkspaceName { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? GenreIcon { get; set; }

    /// <summary>
    /// ワークスペースモード（Normal/Document）
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<WorkspaceMode>))]
    public WorkspaceMode? Mode { get; set; }

    /// <summary>
    /// タスク追加数（直近）
    /// </summary>
    [Required]
    public required int TaskAddedCount { get; set; }

    /// <summary>
    /// タスク完了数（直近）
    /// </summary>
    [Required]
    public required int TaskCompletedCount { get; set; }

    /// <summary>
    /// タスク関連アクティビティの合計
    /// </summary>
    [Required]
    public required int TotalTaskActivityCount { get; set; }
}