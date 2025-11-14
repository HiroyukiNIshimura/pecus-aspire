using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Workspace;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// ワークスペースコントローラー（一般ユーザー用）
/// </summary>
[Route("api/workspaces")]
[Produces("application/json")]
[Tags("Workspace")]
public class WorkspaceController : BaseSecureController
{
    private readonly WorkspaceService _workspaceService;
    private readonly ILogger<WorkspaceController> _logger;
    private readonly PecusConfig _config;

    public WorkspaceController(
        WorkspaceService workspaceService,
        ProfileService profileService,
        ILogger<WorkspaceController> logger,
        PecusConfig config
    ) : base(profileService, logger)
    {
        _workspaceService = workspaceService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// ログインユーザーがアクセス可能なワークスペース一覧取得（ページネーション）
    /// </summary>
    /// <param name="request">ワークスペース一覧取得リクエスト</param>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceListItemResponse, WorkspaceStatistics>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceListItemResponse, WorkspaceStatistics>>> GetAccessibleWorkspaces(
        [FromQuery] GetWorkspacesRequest request
    )
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        // ログインユーザーがアクセス可能なワークスペースを取得
        (var workspaces, int totalCount) =
            await _workspaceService.GetAccessibleWorkspacesByUserPagedAsync(
                userId: me,
                page: validatedPage,
                pageSize: pageSize,
                isActive: request.IsActive,
                genreId: request.GenreId,
                name: request.Name
            );

        var items = workspaces
            .Select(w => new WorkspaceListItemResponse
            {
                Id = w.Id,
                Name = w.Name,
                Code = w.Code,
                Description = w.Description,
                OrganizationId = w.OrganizationId,
                OrganizationName = w.Organization?.Name,
                GenreId = w.GenreId,
                GenreName = w.Genre?.Name,
                GenreIcon = w.Genre?.Icon,
                ActiveItemCount = w.WorkspaceItems?.Count(wi => wi.IsActive) ?? 0,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt,
                IsActive = w.IsActive,
                MemberCount = w.WorkspaceUsers?.Count ?? 0,
                Members = w.WorkspaceUsers?
                    .Where(wu => wu.User != null && wu.User.IsActive)
                    .Select(wu => new WorkspaceUserDetailResponse
                    {
                        WorkspaceId = wu.WorkspaceId,
                        UserId = wu.UserId,
                        Username = wu.User!.Username,
                        Email = wu.User.Email,
                        WorkspaceRole = wu.WorkspaceRole,
                        JoinedAt = wu.JoinedAt,
                        LastAccessedAt = wu.LastAccessedAt,
                        IsActive = wu.User.IsActive,
                    })
                    .ToList(),
            })
            .ToList();

        // ログインユーザーがアクセス可能なワークスペースの統計情報を取得
        var statistics = await _workspaceService.GetAccessibleWorkspaceStatisticsAsync(me);

        var response = PaginationHelper.CreatePagedResponse(
            data: items,
            totalCount: totalCount,
            page: validatedPage,
            pageSize: pageSize,
            summary: statistics
        );

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペース詳細情報取得（ログインユーザーがアクセス可能なもののみ）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(WorkspaceFullDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceFullDetailResponse>> GetWorkspaceDetail(int id)
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // ワークスペースアクセス権限チェック
        await _workspaceService.CheckWorkspaceAccessAsync(workspaceId: id, userId: me);

        // ワークスペース詳細情報を取得
        var (wId, name, code, description, createdAt, createdBy, updatedAt, updatedBy, genre, members) =
            await _workspaceService.GetWorkspaceDetailAsync(id);

        var response = new WorkspaceFullDetailResponse
        {
            Id = wId,
            Name = name,
            Code = code,
            Description = description,
            CreatedAt = createdAt,
            CreatedBy = createdBy,
            UpdatedAt = updatedAt,
            UpdatedBy = updatedBy,
            Genre = genre,
            Members = members,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペース内のアイテム一覧取得（有効なアイテムのみ、ページング対応）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="request">ページネーションリクエスト</param>
    [HttpGet("{id:int}/items")]
    [ProducesResponseType(typeof(WorkspaceItemListPagedResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemListPagedResponse>> GetWorkspaceItems(
        int id,
        [FromQuery] GetWorkspaceItemsRequest request
    )
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // ワークスペースアクセス権限チェック
        await _workspaceService.CheckWorkspaceAccessAsync(workspaceId: id, userId: me);

        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        // ワークスペース内のアイテム一覧を取得
        (var items, int totalCount) = await _workspaceService.GetWorkspaceItemsAsync(
            workspaceId: id,
            page: validatedPage,
            pageSize: pageSize
        );

        var data = items
            .Select(item => new WorkspaceItemListResponse
            {
                Id = item.Id,
                Code = item.Code,
                Subject = item.Subject,
                Priority = item.Priority,
                IsDraft = item.IsDraft,
                IsArchived = item.IsArchived,
                CreatedAt = item.CreatedAt,
                IsAssigned = item.IsAssigned,
                Owner = item.Owner,
            })
            .ToList();

        var response = new WorkspaceItemListPagedResponse
        {
            CurrentPage = validatedPage,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            TotalCount = totalCount,
            Data = data,
        };

        return TypedResults.Ok(response);
    }
}
