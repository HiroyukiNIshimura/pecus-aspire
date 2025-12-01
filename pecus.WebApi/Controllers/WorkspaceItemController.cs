using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/workspaces/{workspaceId}/items")]
[Produces("application/json")]
[Tags("WorkspaceItem")]
public class WorkspaceItemController : BaseSecureController
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILogger<WorkspaceItemController> _logger;
    private readonly PecusConfig _config;

    public WorkspaceItemController(
        WorkspaceItemService workspaceItemService,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService,
        ILogger<WorkspaceItemController> logger,
        PecusConfig config
    ) : base(profileService, logger)
    {
        _workspaceItemService = workspaceItemService;
        _accessHelper = accessHelper;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// ワークスペースアイテム作成
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> CreateWorkspaceItem(
        int workspaceId,
        [FromBody] CreateWorkspaceItemRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムを作成できます。"
            );
        }

        var item = await _workspaceItemService.CreateWorkspaceItemAsync(
            workspaceId,
            request,
            CurrentUserId
        );

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "ワークスペースアイテムを作成しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム取得
    /// </summary>
    [HttpGet("{itemId}")]
    [ProducesResponseType(typeof(WorkspaceItemDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemDetailResponse>> GetWorkspaceItem(
        int workspaceId,
        int itemId
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

        var response = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテムをコードで取得
    /// </summary>
    [HttpGet("code/{code}")]
    [ProducesResponseType(typeof(WorkspaceItemDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemDetailResponse>> GetWorkspaceItemByCode(
        int workspaceId,
        string code
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var item = await _workspaceItemService.GetWorkspaceItemByCodeAsync(workspaceId, code);

        var response = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム一覧取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceItemDetailResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceItemDetailResponse>>> GetWorkspaceItems(
        int workspaceId,
        [FromQuery] Models.Requests.WorkspaceItem.GetWorkspaceItemsRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            // 空の結果を返す
            var emptyResponse = PaginationHelper.CreatePagedResponse(
                data: new List<WorkspaceItemDetailResponse>(),
                totalCount: 0,
                page: request.Page,
                pageSize: _config.Pagination.DefaultPageSize
            );
            return TypedResults.Ok(emptyResponse);
        }

        // pinnedフィルタを使用する場合は認証が必要
        int? pinnedByUserId = null;
        if (request.Pinned.HasValue && request.Pinned.Value)
        {
            pinnedByUserId = CurrentUserId;
        }

        var pageSize = _config.Pagination.DefaultPageSize;
        var (items, totalCount) = await _workspaceItemService.GetWorkspaceItemsAsync(
            workspaceId: workspaceId,
            page: request.Page,
            pageSize: pageSize,
            isDraft: request.IsDraft,
            isArchived: request.IsArchived,
            assigneeId: request.AssigneeId,
            priority: request.Priority,
            pinnedByUserId: pinnedByUserId,
            searchQuery: request.SearchQuery
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

    /// <summary>
    /// ワークスペースアイテム更新
    /// </summary>
    [HttpPatch("{itemId}")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceItemDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> UpdateWorkspaceItem(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムを更新できます。"
            );
        }

        var item = await _workspaceItemService.UpdateWorkspaceItemAsync(
            workspaceId,
            itemId,
            request,
            CurrentUserId
        );

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "ワークスペースアイテムを更新しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテムステータス更新
    /// </summary>
    [HttpPatch("{itemId}/status")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceItemDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> UpdateWorkspaceItemStatus(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemStatusRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムのステータスを更新できます。"
            );
        }

        var item = await _workspaceItemService.UpdateWorkspaceItemStatusAsync(
            workspaceId,
            itemId,
            request,
            CurrentUserId
        );

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "ワークスペースアイテムのステータスを更新しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム担当者設定
    /// </summary>
    [HttpPatch("{itemId}/assignee")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceItemDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> UpdateWorkspaceItemAssignee(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemAssigneeRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムの担当者を変更できます。"
            );
        }

        var item = await _workspaceItemService.UpdateWorkspaceItemAssigneeAsync(
            workspaceId,
            itemId,
            request,
            CurrentUserId
        );

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "ワークスペースアイテムの担当者を更新しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム削除
    /// </summary>
    [HttpDelete("{itemId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeleteWorkspaceItem(int workspaceId, int itemId)
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムを削除できます。"
            );
        }

        await _workspaceItemService.DeleteWorkspaceItemAsync(workspaceId, itemId, CurrentUserId);

        var response = new SuccessResponse
        {
            StatusCode = StatusCodes.Status200OK,
            Message = "ワークスペースアイテムを削除しました。",
        };

        return TypedResults.Ok(response);
    }
}