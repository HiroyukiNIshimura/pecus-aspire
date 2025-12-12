using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// ユーザー検索リクエスト
/// </summary>
public class SearchUsersRequest
{
    /// <summary>
    /// 検索クエリ（2文字以上100文字以内）
    /// </summary>
    [Required(ErrorMessage = "検索クエリは必須です。")]
    [MinLength(2, ErrorMessage = "検索クエリは2文字以上で入力してください。")]
    [MaxLength(100, ErrorMessage = "検索クエリは100文字以内で入力してください。")]
    public required string Q { get; set; }

    /// <summary>
    /// 取得件数上限（1〜50、デフォルト20）
    /// </summary>
    [Range(1, 50, ErrorMessage = "取得件数は1〜50の範囲で指定してください。")]
    public int Limit { get; set; } = 20;
}