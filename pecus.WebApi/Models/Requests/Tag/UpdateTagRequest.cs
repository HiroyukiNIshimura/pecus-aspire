using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Tag;

/// <summary>
/// タグ更新リクエスト
/// </summary>
public class UpdateTagRequest
{
    /// <summary>
    /// タグ名
    /// </summary>
    [Required(ErrorMessage = "タグ名は必須です。")]
    [MaxLength(50, ErrorMessage = "タグ名は50文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// タグの楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required byte[] RowVersion { get; set; }
}
