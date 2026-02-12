namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// 実績の難易度を表す列挙型
/// </summary>
public enum AchievementDifficulty
{
    /// <summary>
    /// 容易（既存データで判定可能）
    /// </summary>
    Easy = 1,

    /// <summary>
    /// 中難易度（履歴/ログの集計が必要）
    /// </summary>
    Medium = 2,

    /// <summary>
    /// 高難易度（専用ロジックが必要）
    /// </summary>
    Hard = 3
}