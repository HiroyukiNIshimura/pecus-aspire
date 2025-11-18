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
}