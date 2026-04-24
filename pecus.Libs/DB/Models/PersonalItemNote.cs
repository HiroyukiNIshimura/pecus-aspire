using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// アイテムの個人メモエンティティ
/// ユーザーが各アイテムに対して個人的に記録するプライベートメモ。
/// 本人のみがアクセス可能であり、他のメンバーや管理者には公開されない。
/// </summary>
public class PersonalItemNote
{
    /// <summary>
    /// メモID（主キー）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペースアイテムID（外部キー）
    /// </summary>
    [Required]
    public int WorkspaceItemId { get; set; }

    /// <summary>
    /// メモ所有者ユーザーID（外部キー）
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// メモ内容
    /// </summary>
    [Required]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }

    // ナビゲーションプロパティ

    /// <summary>
    /// ワークスペースアイテム
    /// </summary>
    [ForeignKey(nameof(WorkspaceItemId))]
    public WorkspaceItem? WorkspaceItem { get; set; }

    /// <summary>
    /// メモ所有者ユーザー
    /// </summary>
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
}
