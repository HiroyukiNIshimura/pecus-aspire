using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// マイワークスペースアイテムコントローラー
/// ログインユーザーに関連するワークスペースアイテムを横断的に取得
/// </summary>
[Route("api/my/workspace-items")]
[Produces("application/json")]
[Tags("My")]
public class MyItemController : BaseSecureController
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly ILogger<MyItemController> _logger;
    private readonly PecusConfig _config;

    public MyItemController(
        WorkspaceItemService workspaceItemService,
        ProfileService profileService,
        ILogger<MyItemController> logger,
        PecusConfig config
    ) : base(profileService, logger)
    {
        _workspaceItemService = workspaceItemService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// マイアイテム一覧を取得
    /// ログインユーザーがオーナー、担当者、コミッター、またはPIN済みのアイテムを取得
    /// </summary>
    /// <param name="request">フィルタリクエスト</param>
    /// <returns>ワークスペースアイテム一覧</returns>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceItemDetailResponse, WorkspaceItemStatistics>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceItemDetailResponse, WorkspaceItemStatistics>>> GetMyItems(
        [FromQuery] GetMyItemsRequest request
    )
    {
        var pageSize = _config.Pagination.DefaultPageSize;
        var (items, totalCount, workspaces) = await _workspaceItemService.GetMyItemsAsync(
            userId: CurrentUserId,
            relation: request.Relation,
            page: request.Page,
            pageSize: pageSize,
            includeArchived: request.IncludeArchived,
            workspaceIds: request.WorkspaceIds,
            sortBy: request.SortBy,
            order: request.Order
        );

        var itemResponses = items
            .Select(item => WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId))
            .ToList();

        var statistics = new WorkspaceItemStatistics
        {
            Workspaces = workspaces.Select(w => new SummaryWorkspaceResponse
            {
                Id = w.Id,
                Name = w.Name,
                Code = w.Code,
                GenreId = w.GenreId,
                GenreName = w.Genre?.Name,
                GenreIcon = w.Genre?.Icon,
                Mode = w.Mode
            }).ToList()
        };

        var response = PaginationHelper.CreatePagedResponse(
            data: itemResponses,
            totalCount: totalCount,
            page: request.Page,
            pageSize: pageSize,
            summary: statistics
        );


        return TypedResults.Ok(response);
    }
}