using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ジャンル登録リクエスト
/// </summary>
public class CreateGenreRequest
{
    /// <summary>
    /// ジャンル名
    /// </summary>
    [Required(ErrorMessage = "ジャンル名は必須です。")]
    [StringLength(100, ErrorMessage = "ジャンル名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// ジャンルの説明
    /// </summary>
    [StringLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    [StringLength(50, ErrorMessage = "アイコンは50文字以内で入力してください。")]
    public string? Icon { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "表示順は0以上の値を指定してください。")]
    public int DisplayOrder { get; set; }
}

/// <summary>
/// ジャンル更新リクエスト
/// </summary>
public class UpdateGenreRequest
{
    /// <summary>
    /// ジャンル名
    /// </summary>
    [StringLength(100, ErrorMessage = "ジャンル名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// ジャンルの説明
    /// </summary>
    [StringLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    [StringLength(50, ErrorMessage = "アイコンは50文字以内で入力してください。")]
    public string? Icon { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "表示順は0以上の値を指定してください。")]
    public int? DisplayOrder { get; set; }
}
