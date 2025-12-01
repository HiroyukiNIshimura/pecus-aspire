using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

public class GetWorkspaceItemsRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// 下書きかどうか
    /// </summary>
    /// <value></value>
    public bool? IsDraft { get; set; }

    /// <summary>
    /// アーカイブ済みかどうか
    /// </summary>
    /// <value></value>
    public bool? IsArchived { get; set; }

    /// <summary>
    /// 担当者ID
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "有効な担当者IDを指定してください。")]
    public int? AssigneeId { get; set; }

    /// <summary>
    /// オーナーID
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "有効なオーナーIDを指定してください。")]
    public int? OwnerId { get; set; }

    /// <summary>
    /// コミッターID（最後にコミットしたユーザー）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "有効なコミッターIDを指定してください。")]
    public int? CommitterId { get; set; }

    /// <summary>
    /// 優先度
    /// </summary>
    /// <value></value>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// ピン留めされているかどうか
    /// </summary>
    /// <value></value>
    public bool? Pinned { get; set; }

    /// <summary>
    /// あいまい検索クエリ（Subject, RawBody を対象）
    /// pgroonga を使用して日本語のゆらぎやタイポにも対応
    /// </summary>
    [StringLength(200, ErrorMessage = "検索クエリは200文字以内で入力してください。")]
    public string? SearchQuery { get; set; }
}