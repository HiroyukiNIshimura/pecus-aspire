using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ファイルアップロードリクエスト
/// </summary>
public class FileUploadRequest
{
    /// <summary>
    /// ファイルの種類（avatar, genre）
    /// </summary>
    [Required(ErrorMessage = "ファイルの種類は必須です。")]
    [StringLength(50, ErrorMessage = "ファイルの種類は50文字以内で入力してください。")]
    public required string FileType { get; set; }

    /// <summary>
    /// リソースID（ユーザーIDまたはジャンルID）
    /// </summary>
    [Required(ErrorMessage = "リソースIDは必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "リソースIDは1以上である必要があります。")]
    public required int ResourceId { get; set; }

    /// <summary>
    /// アップロードするファイル
    /// </summary>
    [Required(ErrorMessage = "ファイルは必須です。")]
    public required IFormFile File { get; set; }
}
