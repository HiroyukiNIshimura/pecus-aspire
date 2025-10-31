namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース統計情報レスポンス
/// </summary>
public class WorkspaceStatistics
{
    /// <summary>
    /// アクティブなワークスペースの総数
    /// </summary>
    public int ActiveWorkspaceCount { get; set; }

    /// <summary>
    /// 非アクティブなワークスペースの総数
    /// </summary>
    public int InactiveWorkspaceCount { get; set; }

    /// <summary>
    /// 総ワークスペース数（アクティブ + 非アクティブ）
    /// </summary>
    public int TotalWorkspaceCount => ActiveWorkspaceCount + InactiveWorkspaceCount;

    /// <summary>
    /// ワークスペースメンバーの総数（ユニークなユーザー数）
    /// </summary>
    public int UniqueMemberCount { get; set; }

    /// <summary>
    /// 平均メンバー数 per ワークスペース
    /// </summary>
    public double AverageMembersPerWorkspace => TotalWorkspaceCount > 0 ? (double)UniqueMemberCount / TotalWorkspaceCount : 0;

    /// <summary>
    /// 最近作成されたワークスペース数（過去30日）
    /// </summary>
    public int RecentWorkspaceCount { get; set; }

    /// <summary>
    /// ワークスペースのジャンルごとのワークスペース数
    /// </summary>
    public List<GenreCount> WorkspaceCountByGenre { get; set; } = new();
}

/// <summary>
/// ジャンルごとのワークスペース数
/// </summary>
public class GenreCount
{
    /// <summary>
    /// ジャンルID
    /// </summary>
    public int? GenreId { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public string GenreName { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペース数
    /// </summary>
    public int Count { get; set; }
}