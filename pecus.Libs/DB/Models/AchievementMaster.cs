using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// 実績マスタ
/// </summary>
public class AchievementMaster
{
    /// <summary>
    /// 実績マスタID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// システム内ユニークコード（例: EARLY_BIRD）
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 表示名（日本語）
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 表示名（英語）
    /// </summary>
    public string NameEn { get; set; } = string.Empty;

    /// <summary>
    /// 説明文（日本語）
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 説明文（英語）
    /// </summary>
    public string DescriptionEn { get; set; } = string.Empty;

    /// <summary>
    /// ステッカー画像パス（nullの場合はデフォルトアイコン表示）
    /// </summary>
    public string? IconPath { get; set; }

    /// <summary>
    /// 難易度
    /// </summary>
    public AchievementDifficulty Difficulty { get; set; }

    /// <summary>
    /// カテゴリ
    /// </summary>
    public AchievementCategory Category { get; set; }

    /// <summary>
    /// シークレットバッジか（AI判定用）
    /// </summary>
    public bool IsSecret { get; set; }

    /// <summary>
    /// 有効フラグ
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// 表示順
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    public uint RowVersion { get; set; }

    /// <summary>
    /// ユーザー実績（ナビゲーションプロパティ）
    /// </summary>
    public ICollection<UserAchievement> UserAchievements { get; set; } = [];
}
