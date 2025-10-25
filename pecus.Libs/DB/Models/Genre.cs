namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペースジャンルマスタエンティティ
/// </summary>
public class Genre
{
    /// <summary>
    /// ジャンルID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// ジャンルの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int? CreatedByUserId { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// このジャンルを持つワークスペース
    /// </summary>
    public ICollection<Workspace> Workspaces { get; set; } = new List<Workspace>();
}
