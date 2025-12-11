using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using Pecus.Models.Responses.Activity;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// アイテムのアクティビティコントローラー
/// アイテムに対する操作履歴（タイムライン）を取得
/// </summary>
[Route("api/workspaces/{workspaceId}/items/{itemId}/activities")]
[Produces("application/json")]
[Tags("Activity")]
public class ItemActivityController : BaseSecureController
{
    private readonly ActivityService _activityService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly PecusConfig _config;

    public ItemActivityController(
        ActivityService activityService,
        OrganizationAccessHelper accessHelper,
        PecusConfig config,
        ILogger<ItemActivityController> logger,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _activityService = activityService;
        _accessHelper = accessHelper;
        _config = config;
    }

    /// <summary>
    /// アイテムのアクティビティ一覧を取得（タイムライン表示用）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="page">ページ番号（1から開始）</param>
    /// <returns>アクティビティ一覧</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ActivityResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<PagedResponse<ActivityResponse>>> GetItemActivities(
        int workspaceId,
        int itemId,
        [FromQuery] int page = 1
    )
    {
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        var pageSize = _config.Pagination.DefaultPageSize;

        var result = await _activityService.GetActivitiesByItemIdAsync(
            workspaceId,
            itemId,
            page,
            pageSize
        );

        if (result == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        var (activities, totalCount) = result.Value;
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        return TypedResults.Ok(new PagedResponse<ActivityResponse>
        {
            Data = activities.Select(ToResponse).ToList(),
            TotalCount = totalCount,
            CurrentPage = page,
            PageSize = pageSize,
            TotalPages = totalPages,
            HasPreviousPage = page > 1,
            HasNextPage = page < totalPages,
        });
    }

    private static ActivityResponse ToResponse(Activity a) => new()
    {
        Id = a.Id,
        WorkspaceId = a.WorkspaceId,
        ItemId = a.ItemId,
        ItemCode = a.Item?.Code ?? string.Empty,
        ItemSubject = a.Item?.Subject ?? string.Empty,
        UserId = a.UserId,
        Username = a.User?.Username,
        IdentityIconUrl = a.User != null
            ? IdentityIconHelper.GetIdentityIconUrl(a.User.AvatarType, a.User.Id, a.User.Username, a.User.Email, a.User.UserAvatarPath)
            : null,
        ActionType = a.ActionType,
        Details = a.Details,
        CreatedAt = a.CreatedAt,
    };
}
