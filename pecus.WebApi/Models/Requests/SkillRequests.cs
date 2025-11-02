using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// スキル作成リクエスト
/// </summary>
public class CreateSkillRequest
{
    /// <summary>
    /// スキル名
    /// </summary>
    [Required(ErrorMessage = "スキル名は必須です。")]
    [MaxLength(100, ErrorMessage = "スキル名は100文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// スキルの説明
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }
}

/// <summary>
/// スキル更新リクエスト
/// </summary>
public class UpdateSkillRequest
{
    /// <summary>
    /// スキル名
    /// </summary>
    [MaxLength(100, ErrorMessage = "スキル名は100文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// スキルの説明
    /// </summary>
    [MaxLength(500, ErrorMessage = "説明は500文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool? IsActive { get; set; }
}

/// <summary>
/// スキル一覧取得リクエスト
/// </summary>
public class GetSkillsRequest
{
    /// <summary>
    /// ページ番号（1から始まる）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; }

    /// <summary>
    /// アクティブなスキルのみ取得するか
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// 未使用のスキルのみ取得するか（true: 未使用のみ、false または null: すべて）
    /// </summary>
    public bool? UnusedOnly { get; set; }

    /// <summary>
    /// スキル名で前方一致検索（オプション）
    /// </summary>
    [MaxLength(100, ErrorMessage = "検索名は100文字以内で入力してください。")]
    public string? Name { get; set; }
}
