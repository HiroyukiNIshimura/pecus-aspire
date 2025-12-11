using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Models.Requests.Activity;
using Pecus.Models.Responses.Activity;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/workspaces/{workspaceId}/activities")]
[Produces("application/json")]
[Tags("Activity")]
public class ActivityController : BaseSecureController
{
    private readonly ActivityService _activityService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly PecusConfig _config;

    public ActivityController(
        ActivityService activityService,
        OrganizationAccessHelper accessHelper,
        PecusConfig config,
        ILogger<ActivityController> logger,
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
    [HttpGet("items/{itemId}")]
    [ProducesResponseType(typeof(ActivitiesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ActivitiesResponse>> GetItemActivities(
        int workspaceId,
        int itemId,
        [FromQuery] GetActivitiesRequest request
    )
    {
        // ワークスペースへのアクセス権を確認
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        var pageSize = _config.Pagination.DefaultPageSize;

        var result = await _activityService.GetActivitiesByItemIdAsync(
            workspaceId,
            itemId,
            request.Page,
            pageSize,
            request.StartDate,
            request.EndDate
        );

        if (result == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        var (activities, totalCount) = result.Value;

        var response = new ActivitiesResponse
        {
            Activities = activities
                .Select(a => new ActivityResponse
                {
                    Id = a.Id,
                    WorkspaceId = a.WorkspaceId,
                    ItemId = a.ItemId,
                    ItemCode = a.Item?.Code ?? string.Empty,
                    ItemSubject = a.Item?.Subject ?? string.Empty,
                    UserId = a.UserId,
                    Username = a.User?.Username,
                    ActionType = a.ActionType,
                    Details = a.Details,
                    CreatedAt = a.CreatedAt,
                })
                .ToList(),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = pageSize,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペース内の全アクティビティを取得（統計用）
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ActivitiesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ActivitiesResponse>> GetWorkspaceActivities(
        int workspaceId,
        [FromQuery] GetActivitiesRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var pageSize = _config.Pagination.DefaultPageSize;

        var (activities, totalCount) = await _activityService.GetActivitiesByWorkspaceIdAsync(
            workspaceId,
            request.Page,
            pageSize,
            request.StartDate,
            request.EndDate
        );

        var response = new ActivitiesResponse
        {
            Activities = activities
                .Select(a => new ActivityResponse
                {
                    Id = a.Id,
                    WorkspaceId = a.WorkspaceId,
                    ItemId = a.ItemId,
                    ItemCode = a.Item?.Code ?? string.Empty,
                    ItemSubject = a.Item?.Subject ?? string.Empty,
                    UserId = a.UserId,
                    Username = a.User?.Username,
                    ActionType = a.ActionType,
                    Details = a.Details,
                    CreatedAt = a.CreatedAt,
                })
                .ToList(),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = pageSize,
        };

        return TypedResults.Ok(response);
    }
}
