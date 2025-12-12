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
        typeof(PagedResponse<WorkspaceItemDetailResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceItemDetailResponse>>> GetMyItems(
        [FromQuery] GetMyItemsRequest request
    )
    {
        var pageSize = _config.Pagination.DefaultPageSize;
        var (items, totalCount) = await _workspaceItemService.GetMyItemsAsync(
            userId: CurrentUserId,
            relation: request.Relation,
            page: request.Page,
            pageSize: pageSize,
            includeArchived: request.IncludeArchived
        );

        var itemResponses = items
            .Select(item => WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId))
            .ToList();

        var response = PaginationHelper.CreatePagedResponse(
            data: itemResponses,
            totalCount: totalCount,
            page: request.Page,
            pageSize: pageSize
        );

        return TypedResults.Ok(response);
    }
}