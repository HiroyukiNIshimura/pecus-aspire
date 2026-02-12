namespace Pecus.Libs.DB.Models;

/// <summary>
/// ユーザー実績（獲得した実績を管理）
/// </summary>
public class UserAchievement
{
    /// <summary>
    /// ユーザー実績ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User? User { get; set; }

    /// <summary>
    /// 実績マスタID
    /// </summary>
    public int AchievementMasterId { get; set; }

    /// <summary>
    /// 実績マスタ（ナビゲーションプロパティ）
    /// </summary>
    public AchievementMaster? AchievementMaster { get; set; }

    /// <summary>
    /// 組織ID（検索効率化のため非正規化）
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 組織（ナビゲーションプロパティ）
    /// </summary>
    public Organization? Organization { get; set; }

    /// <summary>
    /// 獲得日時
    /// </summary>
    public DateTimeOffset EarnedAt { get; set; }

    /// <summary>
    /// 通知済みフラグ（Piggyback通知用）
    /// </summary>
    public bool IsNotified { get; set; }

    /// <summary>
    /// 通知日時
    /// </summary>
    public DateTimeOffset? NotifiedAt { get; set; }

    /// <summary>
    /// メインバッジとして装備中か
    /// </summary>
    public bool IsMainBadge { get; set; }
}