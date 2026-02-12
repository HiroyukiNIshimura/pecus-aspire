using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザースキル詳細レスポンス（追加日時・説明を含む）
/// </summary>
public class UserSkillDetailResponse
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

    /// <summary>
    /// スキル説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// スキル追加日時
    /// </summary>
    [Required]
    public required DateTimeOffset AddedAt { get; set; }
}