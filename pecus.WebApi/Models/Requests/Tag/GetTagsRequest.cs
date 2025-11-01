using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Tag;

/// <summary>
/// タグ一覧取得リクエスト
/// </summary>
public class GetTagsRequest
{
    /// <summary>
    /// ページ番号
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// アクティブ状態フィルター
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// 未使用のタグのみ取得するか（true: 未使用のみ、false または null: すべて）
    /// </summary>
    public bool? UnusedOnly { get; set; }

    /// <summary>
    /// タグ名で前方一致検索（オプション）
    /// </summary>
    [MaxLength(100, ErrorMessage = "検索名は100文字以内で入力してください。")]
    public string? Name { get; set; }
}
