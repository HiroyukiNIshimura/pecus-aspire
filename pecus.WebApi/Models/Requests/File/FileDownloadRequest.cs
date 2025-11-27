using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.File;

/// <summary>
/// ファイルダウンロード用のリクエストDTO
/// ルートおよびクエリからのバインドを想定しています。
/// </summary>
public class FileDownloadRequest
{
    /// <summary>
    /// ファイル種別（avatar, genre）
    /// </summary>
    [Required(ErrorMessage = "ファイル種別は必須です。")]
    [EnumDataType(typeof(FileType), ErrorMessage = "ファイルの種類が無効です。")]
    public FileType FileType { get; set; } = FileType.Avatar;

    /// <summary>
    /// リソースID（ユーザーIDまたはジャンルID）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "リソースIDは1以上の整数で指定してください。")]
    public int ResourceId { get; set; }

    /// <summary>
    /// ファイル名（拡張子含む）。catch-allパラメータで受け取ります。
    /// </summary>
    [Required(ErrorMessage = "ファイル名は必須です。")]
    [MaxLength(255, ErrorMessage = "ファイル名は255文字以内で入力してください。")]
    public string FileName { get; set; } = string.Empty;
}
