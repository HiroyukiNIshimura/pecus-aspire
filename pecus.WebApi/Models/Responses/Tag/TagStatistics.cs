using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Tag;

/// <summary>
/// タグ利用統計のレスポンス
/// </summary>
public class TagStatistics
{
    /// <summary>
    /// タグのトータル件数
    /// </summary>
    [Required]
    public required int TotalTags { get; set; } = 0;

    /// <summary>
    /// アクティブなタグの件数
    /// </summary>
    [Required]
    public required int ActiveTags { get; set; } = 0;

    /// <summary>
    /// 非アクティブなタグの件数
    /// </summary>
    [Required]
    public required int InactiveTags { get; set; } = 0;

    /// <summary>
    /// 利用されているタグのトップ５
    /// </summary>
    [Required]
    public required List<TagUsageItem> TopUsedTags { get; set; } = new();

    /// <summary>
    /// 利用されていないタグのリスト
    /// </summary>
    [Required]
    public required List<TagUsageItem> UnusedTags { get; set; } = new();
}

/// <summary>
/// タグ利用アイテム（ID と名前）
/// </summary>
public class TagUsageItem
{
    /// <summary>
    /// タグID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// タグ名
    /// </summary>
    [Required]
    public required string Name { get; set; }
}

