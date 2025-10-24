using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// 権限作成リクエスト
/// </summary>
public class CreatePermissionRequest
{
    /// <summary>
    /// 権限名
    /// </summary>
    [Required(ErrorMessage = "権限名は必須です。")]
    [StringLength(100, ErrorMessage = "権限名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// 権限の説明
    /// </summary>
    [StringLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// カテゴリ
    /// </summary>
    [StringLength(50, ErrorMessage = "カテゴリは50文字以内で入力してください。")]
    public string? Category { get; set; }
}
