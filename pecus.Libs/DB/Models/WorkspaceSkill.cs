namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペーススキル（多対多の中間テーブル）
/// ワークスペースが必要とするスキルを管理します
/// </summary>
public class WorkspaceSkill
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// スキルID
    /// </summary>
    public int SkillId { get; set; }

    /// <summary>
    /// 追加日時
    /// </summary>
    public DateTimeOffset AddedAt { get; set; }

    /// <summary>
    /// 追加者ユーザーID
    /// </summary>
    public int? AddedByUserId { get; set; }

    // ナビゲーションプロパティ
    /// <summary>
    /// ワークスペース
    /// </summary>
    public Workspace Workspace { get; set; } = null!;

    /// <summary>
    /// スキル
    /// </summary>
    public Skill Skill { get; set; } = null!;

    /// <summary>
    /// 追加者
    /// </summary>
    public User? AddedByUser { get; set; }
}