using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペーススキル情報
/// </summary>
public class WorkspaceSkillResponse
{
    /// <summary>
    /// スキルID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// スキル名
    /// </summary>
    [Required]
    public required string Name { get; set; }
}
