using System.ComponentModel.DataAnnotations;

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
    [Required(ErrorMessage = "タグ名は必須です。")]
    [StringLength(50, ErrorMessage = "タグ名は50文字以内です。")]
    public string? Name { get; set; }
}