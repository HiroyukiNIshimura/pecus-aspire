namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// タグ情報レスポンス
/// </summary>
public class TagInfoResponse
{
    /// <summary>
    /// タグID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// タグ名
    /// </summary>
    public string Name { get; set; } = string.Empty;
}
