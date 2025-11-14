using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Workspace;

/// <summary>
/// ワークスペース一覧取得リクエスト
/// </summary>
public class GetWorkspacesRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; } = 1;

    public bool? IsActive { get; set; }

    public int? GenreId { get; set; }

    [MaxLength(100, ErrorMessage = "検索名は100文字以内で入力してください。")]
    public string? Name { get; set; }
}
