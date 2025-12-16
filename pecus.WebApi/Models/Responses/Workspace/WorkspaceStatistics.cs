using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース統計情報レスポンス
/// </summary>
public class WorkspaceStatistics
{
    /// <summary>
    /// アクティブなワークスペースの総数
    /// </summary>
    [Required]
    public required int ActiveWorkspaceCount { get; set; } = 0;

    /// <summary>
    /// 非アクティブなワークスペースの総数
    /// </summary>
    [Required]
    public required int InactiveWorkspaceCount { get; set; } = 0;

    /// <summary>
    /// 総ワークスペース数（アクティブ + 非アクティブ）
    /// </summary>
    [Required]
    public required int TotalWorkspaceCount { get; set; } = 0;

    /// <summary>
    /// ワークスペースメンバーの総数（ユニークなユーザー数）
    /// </summary>
    [Required]
    public required int UniqueMemberCount { get; set; } = 0;

    /// <summary>
    /// 平均メンバー数 per ワークスペース
    /// </summary>
    [Required]
    public required double AverageMembersPerWorkspace { get; set; } = 0;

    /// <summary>
    /// 最近作成されたワークスペース数（過去30日）
    /// </summary>
    [Required]
    public required int RecentWorkspaceCount { get; set; } = 0;

    /// <summary>
    /// ワークスペースのジャンルごとのワークスペース数
    /// </summary>
    [Required]
    public required List<GenreCount> WorkspaceCountByGenre { get; set; } = new();
}