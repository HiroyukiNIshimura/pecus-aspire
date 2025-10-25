namespace Pecus.Models.Requests.Tag;

/// <summary>
/// タグ更新リクエスト
/// </summary>
public class UpdateTagRequest
{
    /// <summary>
    /// タグ名
    /// </summary>
    public required string Name { get; set; }
}
