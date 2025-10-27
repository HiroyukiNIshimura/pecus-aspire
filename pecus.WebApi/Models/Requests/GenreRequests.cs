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
    [MaxLength(100, ErrorMessage = "ジャンル名は100文字以内で入力してください。")]
    public required string Name { get; set; }

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
}

/// <summary>
/// ジャンル一覧取得リクエスト
/// </summary>
public class GetGenresRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; } = 1;

    public bool? ActiveOnly { get; set; }
}
