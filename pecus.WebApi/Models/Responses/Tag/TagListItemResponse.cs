using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Tag;

/// <summary>
/// タグリストアイテムレスポンス
/// </summary>
public class TagListItemResponse
{
    /// <summary>
    /// タグID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// タグ名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// アクティブ状態
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// このタグが付与されているアイテム数
    /// </summary>
    public int ItemCount { get; set; }
}

