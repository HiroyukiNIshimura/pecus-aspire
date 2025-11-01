using Microsoft.AspNetCore.Authorization;
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
[ApiController]
[Route("api/admin/workspaces")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class AdminWorkspaceController : ControllerBase
{
    private readonly WorkspaceService _workspaceService;
    private readonly WorkspaceAccessHelper _accessHelper;
    private readonly ILogger<AdminWorkspaceController> _logger;
    private readonly PecusConfig _config;

    public AdminWorkspaceController(
        WorkspaceService workspaceService,
        WorkspaceAccessHelper accessHelper,
        ILogger<AdminWorkspaceController> logger,
        PecusConfig config
    )
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
    public async Task<
        Results<
            Ok<WorkspaceResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > CreateWorkspace([FromBody] CreateWorkspaceRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ログインユーザーの情報を取得して組織IDを取得
            var organizationId = await _accessHelper.GetUserOrganizationIdAsync(me);
            if (!organizationId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "ユーザーが組織に所属していません。",
                    }
                );
            }

            var workspace = await _workspaceService.CreateWorkspaceAsync(
                request,
                organizationId.Value,
                me
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
                },
            };
            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (DuplicateException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペース登録中にエラーが発生しました。Name: {Name}",
                request.Name
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペース情報取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(WorkspaceDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<WorkspaceDetailResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetWorkspace(int id)
    {
        try
        {
            var (hasAccess, workspace) = await CheckWorkspaceAccessAsync(id);
            if (!hasAccess || workspace == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
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
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ワークスペース情報取得中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
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
    public async Task<
        Results<Ok<PagedResponse<WorkspaceListItemResponse, WorkspaceStatistics>>, StatusCodeHttpResult>
    > GetWorkspaces([FromQuery] GetWorkspacesRequest request)
    {
        try
        {
            var organizationId = await GetUserOrganizationIdAsync();
            if (!organizationId.HasValue)
            {
                // 認証済みユーザーが組織に所属していない場合、空のリストを返す
                return TypedResults.Ok(
                    PaginationHelper.CreatePagedResponse<WorkspaceListItemResponse, WorkspaceStatistics>(
                        data: new List<WorkspaceListItemResponse>(),
                        totalCount: 0,
                        page: 1,
                        pageSize: _config.Pagination.DefaultPageSize,
                        summary: new WorkspaceStatistics()
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

            var response = PaginationHelper.CreatePagedResponse<WorkspaceListItemResponse, WorkspaceStatistics>(
                data: items,
                totalCount: totalCount,
                page: validatedPage,
                pageSize: pageSize,
                summary: statistics
            );
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ワークスペース一覧取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペース更新
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(WorkspaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UpdateWorkspace(int id, [FromBody] UpdateWorkspaceRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var (hasAccess, existingWorkspace) = await CheckWorkspaceAccessAsync(id);
            if (!hasAccess || existingWorkspace == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            var workspace = await _workspaceService.UpdateWorkspaceAsync(id, request, me);

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
                    CreatedAt = workspace.CreatedAt,
                    CreatedByUserId = workspace.CreatedByUserId,
                    UpdatedAt = workspace.UpdatedAt,
                    UpdatedByUserId = workspace.UpdatedByUserId,
                    IsActive = workspace.IsActive,
                },
            };
            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (DuplicateException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ワークスペース更新中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペース削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > DeleteWorkspace(int id)
    {
        try
        {
            var (hasAccess, workspace) = await CheckWorkspaceAccessAsync(id);
            if (!hasAccess || workspace == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            var result = await _workspaceService.DeleteWorkspaceAsync(id);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "ワークスペースが正常に削除されました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ワークスペース削除中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペース無効化
    /// </summary>
    [HttpPatch("{id}/deactivate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > DeactivateWorkspace(int id)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var (hasAccess, workspace) = await CheckWorkspaceAccessAsync(id);
            if (!hasAccess || workspace == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            var result = await _workspaceService.DeactivateWorkspaceAsync(id, me);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "ワークスペースが正常に無効化されました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ワークスペース無効化中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペース有効化
    /// </summary>
    [HttpPatch("{id}/activate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > ActivateWorkspace(int id)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var (hasAccess, workspace) = await CheckWorkspaceAccessAsync(id);
            if (!hasAccess || workspace == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            var result = await _workspaceService.ActivateWorkspaceAsync(id, me);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "ワークスペースが正常に有効化されました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ワークスペース有効化中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースにユーザーを参加させる
    /// </summary>
    [HttpPost("{id}/users")]
    [ProducesResponseType(typeof(WorkspaceUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceUserResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > AddUserToWorkspace(int id, [FromBody] AddUserToWorkspaceRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var (hasAccess, workspace) = await CheckWorkspaceAccessAsync(id);
            if (!hasAccess || workspace == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            var workspaceUser = await _workspaceService.AddUserToWorkspaceAsync(
                id,
                request,
                me
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
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
        }
        catch (DuplicateException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースにユーザーを参加させる処理中にエラーが発生しました。WorkspaceId: {WorkspaceId}, UserId: {UserId}",
                id,
                request.UserId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースからユーザーを削除
    /// </summary>
    [HttpDelete("{id}/users/{userId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > RemoveUserFromWorkspace(int id, int userId)
    {
        try
        {
            var (hasAccess, workspace) = await CheckWorkspaceAccessAsync(id);
            if (!hasAccess || workspace == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースが見つかりません。",
                    }
                );
            }

            var result = await _workspaceService.RemoveUserFromWorkspaceAsync(id, userId);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ワークスペースメンバーが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "ユーザーがワークスペースから正常に削除されました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースからユーザーを削除する処理中にエラーが発生しました。WorkspaceId: {WorkspaceId}, UserId: {UserId}",
                id,
                userId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
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
    public async Task<
        Results<Ok<PagedResponse<WorkspaceUserDetailResponse, object>>, StatusCodeHttpResult>
    > GetWorkspaceMembers(int id, [FromQuery] GetWorkspaceMembersRequest request)
    {
        try
        {
            var (hasAccess, workspace) = await CheckWorkspaceAccessAsync(id);
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
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースメンバー一覧取得中にエラーが発生しました。WorkspaceId: {WorkspaceId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ログインユーザーの組織IDを取得（組織に所属していない場合はnullを返す）
    /// </summary>
    private async Task<int?> GetUserOrganizationIdAsync()
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
        return await _accessHelper.GetUserOrganizationIdAsync(me);
    }

    /// <summary>
    /// ログインユーザーが指定したワークスペースにアクセス可能かチェック
    /// </summary>
    private async Task<(bool hasAccess, Workspace? workspace)> CheckWorkspaceAccessAsync(
        int workspaceId
    )
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
        return await _accessHelper.CheckWorkspaceAccessAsync(me, workspaceId);
    }
}
