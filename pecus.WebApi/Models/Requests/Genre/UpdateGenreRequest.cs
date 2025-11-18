using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Genre;

/// <summary>
/// ジャンル更新リクエスト
/// </summary>
public class UpdateGenreRequest
{
    /// <summary>
    /// ジャンル名
    /// </summary>
    [MaxLength(100, ErrorMessage = "ジャンル名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// ジャンルの説明
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    [MaxLength(50, ErrorMessage = "アイコンは50文字以内で入力してください。")]
    public string? Icon { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "表示順は0以上の値を指定してください。")]
    public int? DisplayOrder { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// ジャンルの楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}