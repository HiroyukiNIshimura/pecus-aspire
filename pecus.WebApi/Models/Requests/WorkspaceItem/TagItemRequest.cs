namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// タグ情報のリクエスト DTO
/// </summary>
public class TagItemRequest
{
    /// <summary>
    /// タグID（既存タグの場合は指定、新規タグの場合はnull）
    /// </summary>
    public int? Id { get; set; }

    /// <summary>
    /// タグの楽観的ロック用のRowVersion（既存タグの場合は指定）
    /// </summary>
    public byte[]? RowVersion { get; set; }

    /// <summary>
    /// タグ名
    /// </summary>
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "タグ名は必須です。")]
    [System.ComponentModel.DataAnnotations.StringLength(50, ErrorMessage = "タグ名は50文字以内です。")]
    public string? Name { get; set; }
}
