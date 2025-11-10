using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ファイルダウンロードリクエスト（アイコン取得）
/// </summary>
public class GetIconRequest
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
    /// ファイル名
    /// </summary>
    [Required(ErrorMessage = "ファイル名は必須です。")]
    [StringLength(255, ErrorMessage = "ファイル名は255文字以内で入力してください。")]
    public required string FileName { get; set; }
}
