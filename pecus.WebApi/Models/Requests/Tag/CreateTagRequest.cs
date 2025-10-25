namespace Pecus.Models.Requests.Tag;

/// <summary>
/// タグ作成リクエスト
/// </summary>
public class CreateTagRequest
{
    /// <summary>
    /// タグ名
    /// </summary>
    public required string Name { get; set; }
}
