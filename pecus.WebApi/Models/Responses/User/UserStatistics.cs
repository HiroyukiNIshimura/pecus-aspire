using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザー統計情報レスポンス
/// </summary>
public class UserStatistics
{
    /// <summary>
    /// スキルごとのユーザー数サマリ
    /// </summary>
    [Required]
    public required List<SkillUserCountResponse> SkillCounts { get; set; } = new();

    /// <summary>
    /// ロールごとのユーザー数サマリ
    /// </summary>
    [Required]
    public required List<RoleUserCountResponse> RoleCounts { get; set; } = new();

    /// <summary>
    /// アクティブなユーザー数
    /// </summary>
    [Required]
    public required int ActiveUserCount { get; set; } = 0;

    /// <summary>
    /// 非アクティブなユーザー数
    /// </summary>
    [Required]
    public required int InactiveUserCount { get; set; } = 0;

    /// <summary>
    /// ワークスペースに参加しているユーザー数
    /// </summary>
    [Required]
    public required int WorkspaceParticipationCount { get; set; } = 0;

    /// <summary>
    /// ワークスペースに参加していないユーザー数
    /// </summary>
    [Required]
    public required int NoWorkspaceParticipationCount { get; set; } = 0;
}

