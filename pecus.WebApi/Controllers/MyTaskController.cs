using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// マイタスクコントローラー
/// ログインユーザーに割り当てられたタスクを横断的に取得
/// </summary>
[Route("api/my/tasks")]
[Produces("application/json")]
[Tags("My")]
public class MyTaskController : BaseSecureController
{
    private readonly WorkspaceTaskService _workspaceTaskService;
    private readonly ILogger<MyTaskController> _logger;
    private readonly PecusConfig _config;

    public MyTaskController(
        WorkspaceTaskService workspaceTaskService,
        ProfileService profileService,
        ILogger<MyTaskController> logger,
        PecusConfig config
    ) : base(profileService, logger)
    {
        _workspaceTaskService = workspaceTaskService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// マイタスク一覧を取得
    /// ログインユーザーに割り当てられたタスクを全ワークスペース横断で取得
    /// </summary>
    /// <param name="request">フィルタリクエスト</param>
    /// <returns>タスク一覧（統計情報付き）</returns>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<MyTaskDetailResponse, WorkspaceTaskStatistics>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<MyTaskDetailResponse, WorkspaceTaskStatistics>>> GetMyTasks(
        [FromQuery] GetMyTasksRequest request
    )
    {
        var pageSize = _config.Pagination.DefaultPageSize;
        var (tasks, commentCounts, totalCount) = await _workspaceTaskService.GetMyTasksAsync(
            userId: CurrentUserId,
            request: request
        );

        // 統計情報を取得
        var statistics = await _workspaceTaskService.GetMyTaskStatisticsAsync(CurrentUserId);

        var taskResponses = tasks
            .Select(task => WorkspaceTaskService.BuildMyTaskDetailResponse(
                task,
                commentCounts.GetValueOrDefault(task.Id, 0)
            ))
            .ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var response = new PagedResponse<MyTaskDetailResponse, WorkspaceTaskStatistics>
        {
            Data = taskResponses,
            CurrentPage = request.Page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPreviousPage = request.Page > 1,
            HasNextPage = request.Page < totalPages,
            Summary = statistics,
        };

        return TypedResults.Ok(response);
    }
}
