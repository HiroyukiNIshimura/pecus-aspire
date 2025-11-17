using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Workspace;

/// <summary>
/// ワークスペース更新リクエスト
/// </summary>
public class UpdateWorkspaceRequest
{
    [MaxLength(100, ErrorMessage = "ワークスペース名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "有効なジャンルIDを指定してください。")]
    public int? GenreId { get; set; }

    public bool? IsActive { get; set; }

    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
