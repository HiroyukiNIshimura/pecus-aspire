using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using Pecus.Models.Requests.Activity;
using Pecus.Models.Responses.Activity;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// マイアクティビティコントローラー
/// ログインユーザー自身のアクティビティを取得（「今週何やったっけ？」を振り返るため）
/// </summary>
[Route("api/my/activities")]
[Produces("application/json")]
[Tags("My")]
public class MyActivityController : BaseSecureController
{
    private readonly ActivityService _activityService;
    private readonly PecusConfig _config;

    public MyActivityController(
        ActivityService activityService,
        PecusConfig config,
        ILogger<MyActivityController> logger,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _activityService = activityService;
        _config = config;
    }

    /// <summary>
    /// 自分のアクティビティ一覧を取得（活動レポート用）
    /// </summary>
    /// <param name="request">フィルタリクエスト</param>
    /// <returns>アクティビティ一覧</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ActivityResponse>), StatusCodes.Status200OK)]
    public async Task<Ok<PagedResponse<ActivityResponse>>> GetMyActivities(
        [FromQuery] GetMyActivitiesRequest request
    )
    {
        var pageSize = _config.Pagination.DefaultPageSize;

        var (activities, totalCount) = await _activityService.GetActivitiesByUserIdAsync(
            CurrentUserId,
            request.Page,
            pageSize,
            request.Period
        );

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        return TypedResults.Ok(new PagedResponse<ActivityResponse>
        {
            Data = activities.Select(ToResponse).ToList(),
            TotalCount = totalCount,
            CurrentPage = request.Page,
            PageSize = pageSize,
            TotalPages = totalPages,
            HasPreviousPage = request.Page > 1,
            HasNextPage = request.Page < totalPages,
        });
    }

    private static ActivityResponse ToResponse(Activity a) => new()
    {
        Id = a.Id,
        WorkspaceId = a.WorkspaceId,
        WorkspaceCode = a.Workspace?.Code ?? string.Empty,
        WorkspaceName = a.Workspace?.Name ?? string.Empty,
        WorkspaceGenreIcon = a.Workspace?.Genre?.Icon,
        ItemId = a.ItemId,
        ItemCode = a.Item?.Code ?? string.Empty,
        ItemSubject = a.Item?.Subject ?? string.Empty,
        UserId = a.UserId,
        Username = a.User?.Username,
        ActionType = a.ActionType,
        Details = a.Details,
        CreatedAt = a.CreatedAt,
    };
}