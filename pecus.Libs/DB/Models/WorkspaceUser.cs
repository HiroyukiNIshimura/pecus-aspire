namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペースユーザーエンティティ(ワークスペースとユーザーの多対多中間テーブル)
/// </summary>
public class WorkspaceUser
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペース
    /// </summary>
    public Workspace Workspace { get; set; } = null!;

    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// ワークスペース内での役割(例: Owner, Member, Guest)
    /// </summary>
    public string? WorkspaceRole { get; set; }

    /// <summary>
    /// 参加日時
    /// </summary>
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 最終アクセス日時
    /// </summary>
    public DateTime? LastAccessedAt { get; set; }
}