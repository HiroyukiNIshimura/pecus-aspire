using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Achievement;

/// <summary>
/// バッジ獲得ランキングレスポンス
/// </summary>
public class AchievementRankingResponse
{
    /// <summary>
    /// 難易度ランカー Top3（難しいバッジを多く取得している人）
    /// </summary>
    [Required]
    public required List<RankingItemDto> DifficultyRanking { get; set; }

    /// <summary>
    /// 取得数ランカー Top3（バッジ総数が多い人）
    /// </summary>
    [Required]
    public required List<RankingItemDto> CountRanking { get; set; }

    /// <summary>
    /// 成長速度ランカー Top3（期間あたりの取得効率が高い人）
    /// </summary>
    [Required]
    public required List<RankingItemDto> GrowthRanking { get; set; }
}

/// <summary>
/// ランキング項目DTO
/// </summary>
public class RankingItemDto
{
    /// <summary>
    /// 順位（1〜3）
    /// </summary>
    [Required]
    public required int Rank { get; set; }

    /// <summary>
    /// ユーザーの内部ID
    /// </summary>
    [Required]
    public required int UserInternalId { get; set; }

    /// <summary>
    /// ユーザー情報
    /// </summary>
    [Required]
    public UserIdentityResponse User { get; set; } = new();

    /// <summary>
    /// スコア（各ランキング種別に応じた値）
    /// - 難易度ランキング: 難易度スコア合計
    /// - 取得数ランキング: バッジ取得数
    /// - 成長速度ランキング: 成長スコア（バッジ数/活動日数×100）
    /// </summary>
    [Required]
    public required decimal Score { get; set; }

    /// <summary>
    /// バッジ取得総数（参考表示用）
    /// </summary>
    [Required]
    public required int BadgeCount { get; set; }
}
