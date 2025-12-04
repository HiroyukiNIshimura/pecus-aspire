using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペースアイテムのお気に入りPIN
/// </summary>
public class WorkspaceItemPin
{
    /// <summary>
    /// ワークスペースアイテムID
    /// </summary>
    [Required]
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// ユーザーID
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// PIN作成日時
    /// </summary>
    [Required]
    public DateTimeOffset CreatedAt { get; set; }

    // ナビゲーションプロパティ
    /// <summary>
    /// ワークスペースアイテム
    /// </summary>
    [ForeignKey(nameof(WorkspaceItemId))]
    public WorkspaceItem? WorkspaceItem { get; set; }

    /// <summary>
    /// ユーザー
    /// </summary>
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
}