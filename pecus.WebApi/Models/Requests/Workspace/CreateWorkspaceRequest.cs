using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Workspace;

/// <summary>
/// ワークスペース登録リクエスト
/// </summary>
public class CreateWorkspaceRequest
{
    [Required(ErrorMessage = "ワークスペース名は必須です。")]
    [MaxLength(100, ErrorMessage = "ワークスペース名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "ジャンルは必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "有効なジャンルIDを指定してください。")]
    public required int GenreId { get; set; }
}
