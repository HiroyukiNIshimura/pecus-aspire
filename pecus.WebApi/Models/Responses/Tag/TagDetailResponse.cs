namespace Pecus.Models.Responses.Tag;

/// <summary>
/// タグ詳細レスポンス
/// </summary>
public class TagDetailResponse
{
    /// <summary>
    /// タグID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// タグ名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成者ユーザー名
    /// </summary>
    public string? CreatedByUsername { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// このタグが付与されているアイテム数
    /// </summary>
    public int ItemCount { get; set; }
}
