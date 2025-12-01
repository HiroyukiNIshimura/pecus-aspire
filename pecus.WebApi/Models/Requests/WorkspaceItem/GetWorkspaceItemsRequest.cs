using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

public class GetWorkspaceItemsRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;

    public bool? IsDraft { get; set; }
    public bool? IsArchived { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "有効なユーザーIDを指定してください。")]
    public int? AssigneeId { get; set; }

    public TaskPriority? Priority { get; set; }

    public bool? Pinned { get; set; }

    /// <summary>
    /// あいまい検索クエリ（Subject, RawBody を対象）
    /// pgroonga を使用して日本語のゆらぎやタイポにも対応
    /// </summary>
    [StringLength(200, ErrorMessage = "検索クエリは200文字以内で入力してください。")]
    public string? SearchQuery { get; set; }
}