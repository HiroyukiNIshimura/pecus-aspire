using Pecus.Models.Responses.WorkspaceItem;

namespace Pecus.Libs;

/// <summary>
/// WorkspaceItemのレスポンス構築ヘルパー
/// </summary>
public static class WorkspaceItemResponseHelper
{
    /// <summary>
    /// WorkspaceItemからWorkspaceItemDetailResponseを構築
    /// </summary>
    /// <param name="item">ワークスペースアイテム</param>
    /// <param name="currentUserId">ログイン中のユーザーID（null可）</param>
    /// <returns>WorkspaceItemDetailResponse</returns>
    public static WorkspaceItemDetailResponse BuildItemDetailResponse(
        DB.Models.WorkspaceItem item,
        int? currentUserId
    )
    {
        return new WorkspaceItemDetailResponse
        {
            Id = item.Id,
            WorkspaceId = item.WorkspaceId,
            WorkspaceName = item.Workspace?.Name,
            Code = item.Code,
            Subject = item.Subject,
            Body = item.Body,
            OwnerId = item.OwnerId,
            OwnerUsername = item.Owner?.Username,
            OwnerAvatarUrl =
                item.Owner != null
                    ? IdentityIconHelper.GetIdentityIconUrl(
                        item.Owner.AvatarType,
                        item.Owner.Id,
                        item.Owner.Username,
                        item.Owner.Email,
                        item.Owner.AvatarUrl
                    )
                    : null,
            AssigneeId = item.AssigneeId,
            AssigneeUsername = item.Assignee?.Username,
            AssigneeAvatarUrl =
                item.Assignee != null
                    ? IdentityIconHelper.GetIdentityIconUrl(
                        item.Assignee.AvatarType,
                        item.Assignee.Id,
                        item.Assignee.Username,
                        item.Assignee.Email,
                        item.Assignee.AvatarUrl
                    )
                    : null,
            Priority = item.Priority,
            DueDate = item.DueDate,
            IsArchived = item.IsArchived,
            IsDraft = item.IsDraft,
            CommitterId = item.CommitterId,
            CommitterUsername = item.Committer?.Username,
            CommitterAvatarUrl =
                item.Committer != null
                    ? IdentityIconHelper.GetIdentityIconUrl(
                        item.Committer.AvatarType,
                        item.Committer.Id,
                        item.Committer.Username,
                        item.Committer.Email,
                        item.Committer.AvatarUrl
                    )
                    : null,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
            Tags =
                item.WorkspaceItemTags?.Select(wit => new TagInfoResponse
                {
                    Id = wit.Tag?.Id ?? 0,
                    Name = wit.Tag?.Name ?? string.Empty,
                })
                    .Where(tag => tag.Id > 0 && !string.IsNullOrEmpty(tag.Name))
                    .ToList() ?? new List<TagInfoResponse>(),
            IsPinned =
                currentUserId.HasValue
                && item.WorkspaceItemPins != null
                && item.WorkspaceItemPins.Any(wip => wip.UserId == currentUserId.Value),
            PinCount = item.WorkspaceItemPins?.Count ?? 0,
        };
    }
}
