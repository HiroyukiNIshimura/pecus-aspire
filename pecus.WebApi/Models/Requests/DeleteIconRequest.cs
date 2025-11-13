using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ファイル削除リクエスト（アイコン削除）
/// </summary>
public class DeleteIconRequest
{
    /// <summary>
    /// ファイルの種類（avatar, genre）
    /// </summary>
    [Required(ErrorMessage = "ファイルの種類は必須です。")]
    [EnumDataType(typeof(FileType), ErrorMessage = "ファイルの種類が無効です。")]
    public required FileType FileType { get; set; }

    /// <summary>
    /// リソースID（ユーザーIDまたはジャンルID）
    /// </summary>
    [Required(ErrorMessage = "リソースIDは必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "リソースIDは1以上である必要があります。")]
    public required int ResourceId { get; set; }

    /// <summary>
    /// ファイル名
    /// </summary>
    [Required(ErrorMessage = "ファイル名は必須です。")]
    [StringLength(255, ErrorMessage = "ファイル名は255文字以内で入力してください。")]
    public required string FileName { get; set; }
}
