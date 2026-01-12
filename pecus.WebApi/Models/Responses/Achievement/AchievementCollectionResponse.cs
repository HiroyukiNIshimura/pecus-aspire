using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Achievement;

/// <summary>
/// 実績コレクションレスポンス（バッジコレクションページ用）
/// </summary>
/// <remarks>
/// 全実績マスタをリストで返却し、未取得の実績は情報を隠蔽します。
/// </remarks>
public class AchievementCollectionResponse
{
    /// <summary>
    /// 実績マスタID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 実績コード（例: EARLY_BIRD）
    /// </summary>
    [Required]
    public required string Code { get; set; }

    /// <summary>
    /// 実績名（未取得の場合は "???"）
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// 実績名（英語、未取得の場合は "???"）
    /// </summary>
    [Required]
    public required string NameEn { get; set; }

    /// <summary>
    /// 説明文（未取得の場合は "???"）
    /// </summary>
    [Required]
    public required string Description { get; set; }

    /// <summary>
    /// 説明文（英語、未取得の場合は "???"）
    /// </summary>
    [Required]
    public required string DescriptionEn { get; set; }

    /// <summary>
    /// アイコンパス（未取得の場合は null）
    /// </summary>
    public string? IconPath { get; set; }

    /// <summary>
    /// 難易度
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<AchievementDifficulty>))]
    public required AchievementDifficulty Difficulty { get; set; }

    /// <summary>
    /// カテゴリ
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<AchievementCategory>))]
    public required AchievementCategory Category { get; set; }

    /// <summary>
    /// 取得済みかどうか
    /// </summary>
    [Required]
    public required bool IsEarned { get; set; }

    /// <summary>
    /// 取得日時（未取得の場合は null）
    /// </summary>
    public DateTimeOffset? EarnedAt { get; set; }
}
