using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Achievement;

/// <summary>
/// ユーザー実績レスポンス（取得済み実績用）
/// </summary>
public class UserAchievementResponse
{
    /// <summary>
    /// 実績マスタID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 実績コード
    /// </summary>
    [Required]
    public required string Code { get; set; }

    /// <summary>
    /// 実績名
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// 実績名（英語）
    /// </summary>
    [Required]
    public required string NameEn { get; set; }

    /// <summary>
    /// 説明文
    /// </summary>
    [Required]
    public required string Description { get; set; }

    /// <summary>
    /// 説明文（英語）
    /// </summary>
    [Required]
    public required string DescriptionEn { get; set; }

    /// <summary>
    /// アイコンパス
    /// </summary>
    public string? IconPath { get; set; }

    /// <summary>
    /// 難易度
    /// </summary>
    [Required]
    public required AchievementDifficulty Difficulty { get; set; }

    /// <summary>
    /// カテゴリ
    /// </summary>
    [Required]
    public required AchievementCategory Category { get; set; }

    /// <summary>
    /// 取得日時
    /// </summary>
    [Required]
    public required DateTimeOffset EarnedAt { get; set; }
}
