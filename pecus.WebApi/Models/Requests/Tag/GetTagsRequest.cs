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
}
