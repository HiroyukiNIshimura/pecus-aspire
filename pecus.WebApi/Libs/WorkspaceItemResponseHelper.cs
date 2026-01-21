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
            WorkspaceCode = item.Workspace?.Code,
            WorkspaceName = item.Workspace?.Name,
            GenreIcon = item.Workspace?.Genre?.Icon,
            GenreName = item.Workspace?.Genre?.Name,
            WorkspaceMode = item.Workspace?.Mode,
            Code = item.Code,
            Subject = item.Subject,
            Body = item.Body,
            Owner = new UserIdentityResponse
            {
                Id = item.OwnerId,
                Username = item.Owner?.Username,
                IdentityIconUrl = item.Owner != null
                        ? IdentityIconHelper.GetIdentityIconUrl(
                            iconType: item.Owner.AvatarType,
                            userId: item.Owner.Id,
                            username: item.Owner.Username,
                            email: item.Owner.Email,
                            avatarPath: item.Owner.UserAvatarPath
                        )
                        : null,
                IsActive = item.Owner?.IsActive ?? false,
            },
            Assignee = item.AssigneeId.HasValue ? new UserIdentityResponse
            {
                Id = item.AssigneeId.Value,
                Username = item.Assignee?.Username,
                IdentityIconUrl = item.Assignee != null
                        ? IdentityIconHelper.GetIdentityIconUrl(
                            iconType: item.Assignee.AvatarType,
                            userId: item.Assignee.Id,
                            username: item.Assignee.Username,
                            email: item.Assignee.Email,
                            avatarPath: item.Assignee.UserAvatarPath
                        )
                        : null,
                IsActive = item.Assignee?.IsActive ?? false,
            } : null,
            Priority = item.Priority,
            DueDate = item.DueDate,
            IsArchived = item.IsArchived,
            IsDraft = item.IsDraft,
            Committer = item.CommitterId.HasValue ? new UserIdentityResponse
            {
                Id = item.CommitterId.Value,
                Username = item.Committer?.Username,
                IdentityIconUrl = item.Committer != null
                        ? IdentityIconHelper.GetIdentityIconUrl(
                            iconType: item.Committer.AvatarType,
                            userId: item.Committer.Id,
                            username: item.Committer.Username,
                            email: item.Committer.Email,
                            avatarPath: item.Committer.UserAvatarPath
                        )
                        : null,
                IsActive = item.Committer?.IsActive ?? false,
            } : null,
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
            RelatedItems = BuildRelatedItemsList(item),
            RowVersion = item.RowVersion!,
        };
    }

    /// <summary>
    /// 関連アイテムのリストを構築
    /// </summary>
    private static List<RelatedItemInfo> BuildRelatedItemsList(DB.Models.WorkspaceItem item)
    {
        var relatedItems = new List<RelatedItemInfo>();
        var listIndex = 0;

        // このアイテムが関連元のもの（FromItem）
        if (item.RelationsFrom != null)
        {
            foreach (var relation in item.RelationsFrom)
            {
                if (relation.ToItem != null)
                {
                    relatedItems.Add(new RelatedItemInfo
                    {
                        ListIndex = listIndex++,
                        RelationId = relation.Id,
                        Id = relation.ToItem.Id,
                        Subject = relation.ToItem.Subject,
                        Code = relation.ToItem.Code,
                        RelationType = relation.RelationType,
                        Direction = "from",
                        OwnerId = relation.ToItem.OwnerId,
                        IsArchived = relation.ToItem.IsArchived,
                        Owner = relation.ToItem.Owner != null ? new UserIdentityResponse
                        {
                            Id = relation.ToItem.Owner.Id,
                            Username = relation.ToItem.Owner?.Username,
                            IdentityIconUrl =
                                relation.ToItem.Owner != null
                                    ? IdentityIconHelper.GetIdentityIconUrl(
                                        iconType: relation.ToItem.Owner.AvatarType,
                                        userId: relation.ToItem.Owner.Id,
                                        username: relation.ToItem.Owner.Username,
                                        email: relation.ToItem.Owner.Email,
                                        avatarPath: relation.ToItem.Owner.UserAvatarPath
                                    )
                                    : null,
                            IsActive = relation.ToItem.Owner?.IsActive ?? false,
                        } : new UserIdentityResponse(),
                    });
                }
            }
        }

        // このアイテムが関連先のもの（ToItem）
        if (item.RelationsTo != null)
        {
            foreach (var relation in item.RelationsTo)
            {
                if (relation.FromItem != null)
                {
                    relatedItems.Add(new RelatedItemInfo
                    {
                        ListIndex = listIndex++,
                        RelationId = relation.Id,
                        Id = relation.FromItem.Id,
                        Subject = relation.FromItem.Subject,
                        Code = relation.FromItem.Code,
                        RelationType = relation.RelationType,
                        Direction = "to",
                        OwnerId = relation.FromItem.OwnerId,
                        IsArchived = relation.FromItem.IsArchived,
                        Owner = relation.FromItem.Owner != null ? new UserIdentityResponse
                        {
                            Id = relation.FromItem.Owner.Id,
                            Username = relation.FromItem.Owner?.Username,
                            IdentityIconUrl =
                                relation.FromItem.Owner != null
                                    ? IdentityIconHelper.GetIdentityIconUrl(
                                        iconType: relation.FromItem.Owner.AvatarType,
                                        userId: relation.FromItem.Owner.Id,
                                        username: relation.FromItem.Owner.Username,
                                        email: relation.FromItem.Owner.Email,
                                        avatarPath: relation.FromItem.Owner.UserAvatarPath
                                    )
                                    : null,
                            IsActive = relation.FromItem.Owner?.IsActive ?? false,
                        } : new UserIdentityResponse(),
                    });
                }
            }
        }

        return relatedItems;
    }
}