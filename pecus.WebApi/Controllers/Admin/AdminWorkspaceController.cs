using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Workspace;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// ワークスペース管理コントローラー（組織管理者用）
/// </summary>
[Route("api/admin/workspaces")]
[Produces("application/json")]
[Tags("Admin - Workspace")]
public class AdminWorkspaceController : BaseAdminController
{
    private readonly WorkspaceService _workspaceService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILogger<AdminWorkspaceController> _logger;
    private readonly PecusConfig _config;

    public AdminWorkspaceController(
        WorkspaceService workspaceService,
        OrganizationAccessHelper accessHelper,
        ILogger<AdminWorkspaceController> logger,
        PecusConfig config,
        ProfileService profileService
    ) : base(profileService, logger)
    {
        _workspaceService = workspaceService;
        _accessHelper = accessHelper;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// ワークスペース登録
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceResponse>> CreateWorkspace(
        [FromBody] CreateWorkspaceRequest request
    )
    {
        // ログインユーザーの情報を取得して組織IDを取得
        var organizationId = await _accessHelper.GetUserOrganizationIdAsync(CurrentUserId);
        if (!organizationId.HasValue)
        {
            throw new InvalidOperationException("ユーザーが組織に所属していません。");
        }

        var workspace = await _workspaceService.CreateWorkspaceAsync(
            request,
            organizationId.Value,
            CurrentUserId
        );

        var response = new WorkspaceResponse
        {
            Success = true,
            Message = "ワークスペースが正常に作成されました。",
            Workspace = new WorkspaceDetailResponse
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Code = workspace.Code,
                Description = workspace.Description,
                OrganizationId = workspace.OrganizationId,
                CreatedAt = workspace.CreatedAt,
                CreatedByUserId = workspace.CreatedByUserId,
                IsActive = workspace.IsActive,
                GenreId = workspace.GenreId,
                GenreName = workspace.Genre?.Name,
                GenreIcon = workspace.Genre?.Icon,
                UpdatedAt = workspace.UpdatedAt,
                UpdatedByUserId = workspace.UpdatedByUserId,
                RowVersion = workspace.RowVersion!,
            },
        };
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペース情報取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(WorkspaceDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceDetailResponse>> GetWorkspace(int id)
    {
        var (hasAccess, workspace) = await _accessHelper.CheckWorkspaceAccessAsync(
            userId: CurrentUserId,
            workspaceId: id,
            includeMembers: true
        );
        if (!hasAccess || workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var response = new WorkspaceDetailResponse
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Code = workspace.Code,
            Description = workspace.Description,
            OrganizationId = workspace.OrganizationId,
            Organization =
                workspace.Organization != null
                    ? new Models.Responses.Organization.OrganizationInfoResponse
                    {
                        Id = workspace.Organization.Id,
                        Name = workspace.Organization.Name,
                        Code = workspace.Organization.Code,
                    }
                    : null,
            GenreId = workspace.GenreId,
            GenreName = workspace.Genre?.Name,
            GenreIcon = workspace.Genre?.Icon,
            Members = workspace.WorkspaceUsers?
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
            CreatedAt = workspace.CreatedAt,
            CreatedByUserId = workspace.CreatedByUserId,
            UpdatedAt = workspace.UpdatedAt,
            UpdatedByUserId = workspace.UpdatedByUserId,
            IsActive = workspace.IsActive,
            RowVersion = workspace.RowVersion!,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペース一覧取得（ページネーション）
    /// </summary>
    /// <param name="request">ワークスペース一覧取得リクエスト</param>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceListItemResponse, WorkspaceStatistics>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceListItemResponse, WorkspaceStatistics>>> GetWorkspaces(
        [FromQuery] GetWorkspacesRequest request
    )
    {
        var organizationId = await _accessHelper.GetUserOrganizationIdAsync(CurrentUserId);
        if (!organizationId.HasValue)
        {
            // 認証済みユーザーが組織に所属していない場合、空のリストを返す
            return TypedResults.Ok(
                PaginationHelper.CreatePagedResponse(
                    data: new List<WorkspaceListItemResponse>(),
                    totalCount: 0,
                    page: 1,
                    pageSize: _config.Pagination.DefaultPageSize,
                    summary: new WorkspaceStatistics
                    {
                        ActiveWorkspaceCount = 0,
                        InactiveWorkspaceCount = 0,
                        UniqueMemberCount = 0,
                        RecentWorkspaceCount = 0,
                        WorkspaceCountByGenre = new List<GenreCount>()
                    }
                )
            );
        }

        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        (List<Workspace> workspaces, int totalCount) =
            await _workspaceService.GetWorkspacesByOrganizationPagedAsync(
                organizationId.Value,
                validatedPage,
                pageSize,
                request.IsActive,
                request.GenreId,
                request.Name
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
                MemberCount = w.WorkspaceUsers?.Count ?? 0, // フィルタ済みコレクションの件数
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

        // 統計情報を取得
        var statistics = await _workspaceService.GetWorkspaceStatisticsAsync(organizationId.Value);

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
    /// ワークスペース更新
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(WorkspaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceResponse>> UpdateWorkspace(
        int id,
        [FromBody] UpdateWorkspaceRequest request
    )
    {
        // ログイン中のユーザーIDを取得
        var (hasAccess, existingWorkspace) = await _accessHelper.CheckWorkspaceAccessAsync(CurrentUserId, id);
        if (!hasAccess || existingWorkspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var workspace = await _workspaceService.UpdateWorkspaceAsync(id, request, CurrentUserId);

        var response = new WorkspaceResponse
        {
            Success = true,
            Message = "ワークスペースが正常に更新されました。",
            Workspace = new WorkspaceDetailResponse
            {
                Id = workspace.Id,
                Name = workspace.Name,
                Code = workspace.Code,
                Description = workspace.Description,
                OrganizationId = workspace.OrganizationId,
                GenreId = workspace.GenreId,
                GenreName = workspace.Genre?.Name,
                GenreIcon = workspace.Genre?.Icon,
                CreatedAt = workspace.CreatedAt,
                CreatedByUserId = workspace.CreatedByUserId,
                UpdatedAt = workspace.UpdatedAt,
                UpdatedByUserId = workspace.UpdatedByUserId,
                IsActive = workspace.IsActive,
                RowVersion = workspace.RowVersion!,
            },
        };
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペース削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeleteWorkspace(int id)
    {
        var (hasAccess, workspace) = await _accessHelper.CheckWorkspaceAccessAsync(CurrentUserId, id);
        if (!hasAccess || workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var result = await _workspaceService.DeleteWorkspaceAsync(id);
        if (!result)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse
            {
                StatusCode = StatusCodes.Status200OK,
                Message = "ワークスペースが正常に削除されました。",
            }
        );
    }

    /// <summary>
    /// ワークスペース無効化
    /// </summary>
    [HttpPatch("{id}/deactivate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeactivateWorkspace(int id, [FromBody] uint rowVersion)
    {
        var (hasAccess, workspace) = await _accessHelper.CheckWorkspaceAccessAsync(CurrentUserId, id);
        if (!hasAccess || workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var result = await _workspaceService.DeactivateWorkspaceAsync(
            workspaceId: id,
            rowVersion: rowVersion,
            updatedByUserId: CurrentUserId
        );
        if (!result)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse
            {
                StatusCode = StatusCodes.Status200OK,
                Message = "ワークスペースが正常に無効化されました。",
            }
        );
    }

    /// <summary>
    /// ワークスペース有効化
    /// </summary>
    [HttpPatch("{id}/activate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> ActivateWorkspace(int id, [FromBody] uint rowVersion)
    {
        var (hasAccess, workspace) = await _accessHelper.CheckWorkspaceAccessAsync(CurrentUserId, id);
        if (!hasAccess || workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var result = await _workspaceService.ActivateWorkspaceAsync(
            workspaceId: id,
            rowVersion: rowVersion,
            updatedByUserId: CurrentUserId
        );
        if (!result)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse
            {
                StatusCode = StatusCodes.Status200OK,
                Message = "ワークスペースが正常に有効化されました。",
            }
        );
    }

    /// <summary>
    /// ワークスペースにユーザーを参加させる
    /// </summary>
    [HttpPost("{id}/users")]
    [ProducesResponseType(typeof(WorkspaceUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceUserResponse>> AddUserToWorkspace(
        int id,
        [FromBody] AddUserToWorkspaceRequest request
    )
    {
        var (hasAccess, workspace) = await _accessHelper.CheckWorkspaceAccessAsync(CurrentUserId, id);
        if (!hasAccess || workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var workspaceUser = await _workspaceService.AddUserToWorkspaceAsync(
            id,
            request,
            CurrentUserId
        );

        var response = new WorkspaceUserResponse
        {
            Success = true,
            Message = "ユーザーがワークスペースに正常に参加しました。",
            WorkspaceUser = new WorkspaceUserDetailResponse
            {
                WorkspaceId = workspaceUser.WorkspaceId,
                UserId = workspaceUser.UserId,
                Username = workspaceUser.User?.Username,
                Email = workspaceUser.User?.Email,
                WorkspaceRole = workspaceUser.WorkspaceRole,
                JoinedAt = workspaceUser.JoinedAt,
                LastAccessedAt = workspaceUser.LastAccessedAt,
                IsActive = workspaceUser.User?.IsActive ?? false,
            },
        };
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースからユーザーを削除
    /// </summary>
    [HttpDelete("{id}/users/{userId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> RemoveUserFromWorkspace(int id, int userId)
    {
        var (hasAccess, workspace) = await _accessHelper.CheckWorkspaceAccessAsync(CurrentUserId, id);
        if (!hasAccess || workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var result = await _workspaceService.RemoveUserFromWorkspaceAsync(id, userId);
        if (!result)
        {
            throw new NotFoundException("ワークスペースメンバーが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse
            {
                StatusCode = StatusCodes.Status200OK,
                Message = "ユーザーがワークスペースから正常に削除されました。",
            }
        );
    }

    /// <summary>
    /// ワークスペースのメンバー一覧取得（ページネーション）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="request">ワークスペースメンバー一覧取得リクエスト</param>
    [HttpGet("{id}/users")]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceUserDetailResponse, object>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceUserDetailResponse, object>>> GetWorkspaceMembers(
        int id,
        [FromQuery] GetWorkspaceMembersRequest request
    )
    {
        var (hasAccess, workspace) = await _accessHelper.CheckWorkspaceAccessAsync(CurrentUserId, id);
        if (!hasAccess || workspace == null)
        {
            // 空のリストを返す（ワークスペースが存在しない or アクセス権がない）
            return TypedResults.Ok(
                PaginationHelper.CreatePagedResponse<WorkspaceUserDetailResponse, object>(
                    data: new List<WorkspaceUserDetailResponse>(),
                    totalCount: 0,
                    page: 1,
                    pageSize: _config.Pagination.DefaultPageSize,
                    summary: null
                )
            );
        }

        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        (List<WorkspaceUser> members, int totalCount) = await _workspaceService.GetWorkspaceMembersPagedAsync(
            id,
            validatedPage,
            pageSize,
            request.ActiveOnly
        );

        var items = members
            .Select(m => new WorkspaceUserDetailResponse
            {
                WorkspaceId = m.WorkspaceId,
                UserId = m.UserId,
                Username = m.User?.Username,
                Email = m.User?.Email,
                WorkspaceRole = m.WorkspaceRole,
                JoinedAt = m.JoinedAt,
                LastAccessedAt = m.LastAccessedAt,
                IsActive = m.User?.IsActive ?? false,
            })
            .ToList();

        var response = PaginationHelper.CreatePagedResponse<WorkspaceUserDetailResponse, object>(
            data: items,
            totalCount: totalCount,
            page: validatedPage,
            pageSize: pageSize,
            summary: null
        );
        return TypedResults.Ok(response);
    }
}