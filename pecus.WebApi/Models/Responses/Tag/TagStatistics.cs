namespace Pecus.Models.Responses.Tag;

/// <summary>
/// タグ利用統計のレスポンス
/// </summary>
public class TagStatistics
{
    /// <summary>
    /// タグのトータル件数
    /// </summary>
    public int TotalTags { get; set; }

    /// <summary>
    /// アクティブなタグの件数
    /// </summary>
    public int ActiveTags { get; set; }

    /// <summary>
    /// 非アクティブなタグの件数
    /// </summary>
    public int InactiveTags { get; set; }

    /// <summary>
    /// 利用されているタグのトップ５
    /// </summary>
    public List<TagUsageItem> TopUsedTags { get; set; } = new();

    /// <summary>
    /// 利用されていないタグのリスト
    /// </summary>
    public List<TagUsageItem> UnusedTags { get; set; } = new();
}

/// <summary>
/// タグ利用アイテム（ID と名前）
/// </summary>
public class TagUsageItem
{
    /// <summary>
    /// タグID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// タグ名
    /// </summary>
    public required string Name { get; set; }
}
