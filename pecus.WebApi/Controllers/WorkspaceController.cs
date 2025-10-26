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

namespace Pecus.Controllers;

[ApiController]
[Route("api/workspaces")]
[Produces("application/json")]
public class WorkspaceController : ControllerBase
{
    private readonly WorkspaceService _workspaceService;
    private readonly UserService _userService;
    private readonly ILogger<WorkspaceController> _logger;
    private readonly PecusConfig _config;

    public WorkspaceController(
        WorkspaceService workspaceService,
        UserService userService,
        ILogger<WorkspaceController> logger,
        PecusConfig config
    )
    {
        _workspaceService = workspaceService;
        _userService = userService;
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
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ログインユーザーの情報を取得して組織IDを取得
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ユーザーが見つかりません。",
                    }
                );
            }

            if (!user.OrganizationId.HasValue)
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
                user.OrganizationId.Value,
                userId
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
            var workspace = await _workspaceService.GetWorkspaceByIdAsync(id);
            if (workspace == null)
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
    /// <param name="page">ページ番号（1から始まる）</param>
    /// <param name="organizationId">組織IDでフィルタ（オプション）</param>
    /// <param name="activeOnly">アクティブなワークスペースのみ取得（オプション）</param>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceListItemResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<PagedResponse<WorkspaceListItemResponse>>, StatusCodeHttpResult>
    > GetWorkspaces(
        [FromQuery] int? page,
        [FromQuery] int? organizationId = null,
        [FromQuery] bool? activeOnly = true
    )
    {
        try
        {
            var validatedPage = PaginationHelper.ValidatePageNumber(page);
            var pageSize = _config.Pagination.DefaultPageSize;

            List<Workspace> workspaces;
            int totalCount;

            if (organizationId.HasValue)
            {
                (workspaces, totalCount) =
                    await _workspaceService.GetWorkspacesByOrganizationPagedAsync(
                        organizationId.Value,
                        validatedPage,
                        pageSize,
                        activeOnly
                    );
            }
            else
            {
                (workspaces, totalCount) = await _workspaceService.GetWorkspacesPagedAsync(
                    validatedPage,
                    pageSize,
                    activeOnly
                );
            }

            var items = workspaces
                .Select(w => new WorkspaceListItemResponse
                {
                    Id = w.Id,
                    Name = w.Name,
                    Code = w.Code,
                    Description = w.Description,
                    OrganizationId = w.OrganizationId,
                    OrganizationName = w.Organization?.Name,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt,
                    IsActive = w.IsActive,
                })
                .ToList();

            var response = PaginationHelper.CreatePagedResponse(
                items,
                validatedPage,
                pageSize,
                totalCount
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
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var workspace = await _workspaceService.UpdateWorkspaceAsync(id, request, userId);

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
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var result = await _workspaceService.DeactivateWorkspaceAsync(id, userId);
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
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var result = await _workspaceService.ActivateWorkspaceAsync(id, userId);
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
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var workspaceUser = await _workspaceService.AddUserToWorkspaceAsync(
                id,
                request,
                userId
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
                    IsActive = workspaceUser.IsActive,
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
    /// <param name="page">ページ番号（1から始まる）</param>
    /// <param name="activeOnly">アクティブなメンバーのみ取得（オプション）</param>
    [HttpGet("{id}/users")]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceUserDetailResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<PagedResponse<WorkspaceUserDetailResponse>>, StatusCodeHttpResult>
    > GetWorkspaceMembers(int id, [FromQuery] int? page, [FromQuery] bool? activeOnly = true)
    {
        try
        {
            var validatedPage = PaginationHelper.ValidatePageNumber(page);
            var pageSize = _config.Pagination.DefaultPageSize;

            var (members, totalCount) = await _workspaceService.GetWorkspaceMembersPagedAsync(
                id,
                validatedPage,
                pageSize,
                activeOnly
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
                    IsActive = m.IsActive,
                })
                .ToList();

            var response = PaginationHelper.CreatePagedResponse(
                items,
                validatedPage,
                pageSize,
                totalCount
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
}
