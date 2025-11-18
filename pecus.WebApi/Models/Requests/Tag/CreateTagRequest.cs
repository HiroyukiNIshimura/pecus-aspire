using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Tag;

/// <summary>
/// タグ作成リクエスト
/// </summary>
public class CreateTagRequest
{
    /// <summary>
    /// タグ名
    /// </summary>
    [Required(ErrorMessage = "タグ名は必須です。")]
    [MaxLength(50, ErrorMessage = "タグ名は50文字以内で入力してください。")]
    public required string Name { get; set; }
}