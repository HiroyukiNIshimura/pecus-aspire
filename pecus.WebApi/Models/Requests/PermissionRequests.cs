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
    [MaxLength(100, ErrorMessage = "権限名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// 権限の説明
    /// </summary>
    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// カテゴリ
    /// </summary>
    [MaxLength(50, ErrorMessage = "カテゴリは50文字以内で入力してください。")]
    public string? Category { get; set; }
}

/// <summary>
/// 権限更新リクエスト
/// </summary>
public class UpdatePermissionRequest
{
    /// <summary>
    /// 権限名
    /// </summary>
    [MaxLength(100, ErrorMessage = "権限名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// 権限の説明
    /// </summary>
    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// カテゴリ
    /// </summary>
    [MaxLength(50, ErrorMessage = "カテゴリは50文字以内で入力してください。")]
    public string? Category { get; set; }

    /// <summary>
    /// 権限の楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }

}

