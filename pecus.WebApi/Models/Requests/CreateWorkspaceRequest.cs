using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ワークスペース登録リクエスト
/// </summary>
public class CreateWorkspaceRequest
{
    [Required(ErrorMessage = "ワークスペース名は必須です。")]
    [MaxLength(100, ErrorMessage = "ワークスペース名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    [MaxLength(50, ErrorMessage = "ワークスペースコードは50文字以内で入力してください。")]
    public string? Code { get; set; }

    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "有効なジャンルIDを指定してください。")]
    public int? GenreId { get; set; }
}
