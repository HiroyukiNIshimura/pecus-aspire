using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザースキル情報レスポンス
/// </summary>
public class UserSkillResponse
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
