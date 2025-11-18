namespace Pecus.Libs.DB.Models;

/// <summary>
/// ユーザースキル（多対多の中間テーブル）
/// </summary>
public class UserSkill
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// スキルID
    /// </summary>
    public int SkillId { get; set; }

    /// <summary>
    /// 追加日時
    /// </summary>
    public DateTime AddedAt { get; set; }

    /// <summary>
    /// 追加者ユーザーID
    /// </summary>
    public int? AddedByUserId { get; set; }

    // ナビゲーションプロパティ
    /// <summary>
    /// ユーザー
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// スキル
    /// </summary>
    public Skill Skill { get; set; } = null!;

    /// <summary>
    /// 追加者
    /// </summary>
    public User? AddedByUser { get; set; }
}