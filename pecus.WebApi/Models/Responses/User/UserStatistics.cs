namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザー統計情報レスポンス
/// </summary>
public class UserStatistics
{
    /// <summary>
    /// スキルごとのユーザー数サマリ
    /// </summary>
    public List<SkillUserCountResponse> SkillCounts { get; set; } = new();

    /// <summary>
    /// ロールごとのユーザー数サマリ
    /// </summary>
    public List<RoleUserCountResponse> RoleCounts { get; set; } = new();

    /// <summary>
    /// アクティブなユーザー数
    /// </summary>
    public int ActiveUserCount { get; set; }

    /// <summary>
    /// 非アクティブなユーザー数
    /// </summary>
    public int InactiveUserCount { get; set; }

    /// <summary>
    /// ワークスペースに参加しているユーザー数
    /// </summary>
    public int WorkspaceParticipationCount { get; set; }

    /// <summary>
    /// ワークスペースに参加していないユーザー数
    /// </summary>
    public int NoWorkspaceParticipationCount { get; set; }
}

/// <summary>
/// スキルごとのユーザー数
/// </summary>
public class SkillUserCountResponse
{
    /// <summary>
    /// スキルID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// スキル名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// ユーザー数
    /// </summary>
    public int Count { get; set; }
}

/// <summary>
/// ロールごとのユーザー数
/// </summary>
public class RoleUserCountResponse
{
    /// <summary>
    /// ロールID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ロール名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// ユーザー数
    /// </summary>
    public int Count { get; set; }
}