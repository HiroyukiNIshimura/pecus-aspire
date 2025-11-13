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
                        iconType: item.Owner.AvatarType,
                        organizationId: item.Owner.OrganizationId,
                        userId: item.Owner.Id,
                        username: item.Owner.Username,
                        email: item.Owner.Email,
                        avatarPath: item.Owner.UserAvatarPath
                    )
                    : null,
            AssigneeId = item.AssigneeId,
            AssigneeUsername = item.Assignee?.Username,
            AssigneeAvatarUrl =
                item.Assignee != null
                    ? IdentityIconHelper.GetIdentityIconUrl(
                        iconType: item.Assignee.AvatarType,
                        organizationId: item.Assignee.OrganizationId,
                        userId: item.Assignee.Id,
                        username: item.Assignee.Username,
                        email: item.Assignee.Email,
                        avatarPath: item.Assignee.UserAvatarPath
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
                        iconType: item.Committer.AvatarType,
                        organizationId: item.Committer.OrganizationId,
                        userId: item.Committer.Id,
                        username: item.Committer.Username,
                        email: item.Committer.Email,
                        avatarPath: item.Committer.UserAvatarPath
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
            RowVersion = item.RowVersion!,
        };
    }
}
