using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// スキル一覧取得リクエスト
/// </summary>
public class GetSkillsRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; }

    public bool? IsActive { get; set; }

    public bool? UnusedOnly { get; set; }

    [MaxLength(100, ErrorMessage = "検索名は100文字以内で入力してください。")]
    public string? Name { get; set; }
}
