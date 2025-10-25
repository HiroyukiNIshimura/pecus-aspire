using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.WorkspaceItem;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.WorkspaceItem;
using Pecus.Services;

namespace Pecus.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId}/items")]
[Produces("application/json")]
public class WorkspaceItemController : ControllerBase
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly ILogger<WorkspaceItemController> _logger;

    public WorkspaceItemController(
        WorkspaceItemService workspaceItemService,
        ILogger<WorkspaceItemController> logger
    )
    {
        _workspaceItemService = workspaceItemService;
        _logger = logger;
    }

    /// <summary>
    /// ワークスペースアイテム作成
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > CreateWorkspaceItem(int workspaceId, [FromBody] CreateWorkspaceItemRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? ownerId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                ownerId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!ownerId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            var item = await _workspaceItemService.CreateWorkspaceItemAsync(
                workspaceId,
                request,
                ownerId.Value
            );

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "ワークスペースアイテムを作成しました。",
                WorkspaceItem = new WorkspaceItemDetailResponse
                {
                    Id = item.Id,
                    WorkspaceId = item.WorkspaceId,
                    WorkspaceName = item.Workspace?.Name,
                    Code = item.Code,
                    Subject = item.Subject,
                    Body = item.Body,
                    OwnerId = item.OwnerId,
                    OwnerUsername = item.Owner?.Username,
                    OwnerAvatarUrl =
                        item.Owner != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Owner.AvatarType,
                                item.Owner.Id,
                                item.Owner.Username,
                                item.Owner.Email,
                                item.Owner.AvatarUrl
                            )
                            : null,
                    AssigneeId = item.AssigneeId,
                    AssigneeUsername = item.Assignee?.Username,
                    AssigneeAvatarUrl =
                        item.Assignee != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Assignee.AvatarType,
                                item.Assignee.Id,
                                item.Assignee.Username,
                                item.Assignee.Email,
                                item.Assignee.AvatarUrl
                            )
                            : null,
                    Priority = item.Priority,
                    DueDate = item.DueDate,
                    IsArchived = item.IsArchived,
                    IsDraft = item.IsDraft,
                    CommitterId = item.CommitterId,
                    CommitterUsername = item.Committer?.Username,
                    CommitterAvatarUrl =
                        item.Committer != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Committer.AvatarType,
                                item.Committer.Id,
                                item.Committer.Username,
                                item.Committer.Email,
                                item.Committer.AvatarUrl
                            )
                            : null,
                    CreatedAt = item.CreatedAt,
                    UpdatedAt = item.UpdatedAt,
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
            _logger.LogError(ex, "ワークスペースアイテム作成中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテム取得
    /// </summary>
    [HttpGet("{itemId}")]
    [ProducesResponseType(typeof(WorkspaceItemDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<WorkspaceItemDetailResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetWorkspaceItem(int workspaceId, int itemId)
    {
        try
        {
            var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

            var response = new WorkspaceItemDetailResponse
            {
                Id = item.Id,
                WorkspaceId = item.WorkspaceId,
                WorkspaceName = item.Workspace?.Name,
                Code = item.Code,
                Subject = item.Subject,
                Body = item.Body,
                OwnerId = item.OwnerId,
                OwnerUsername = item.Owner?.Username,
                OwnerAvatarUrl =
                    item.Owner != null
                        ? IdentityIconHelper.GetIdentityIconUrl(
                            item.Owner.AvatarType,
                            item.Owner.Id,
                            item.Owner.Username,
                            item.Owner.Email,
                            item.Owner.AvatarUrl
                        )
                        : null,
                AssigneeId = item.AssigneeId,
                AssigneeUsername = item.Assignee?.Username,
                AssigneeAvatarUrl =
                    item.Assignee != null
                        ? IdentityIconHelper.GetIdentityIconUrl(
                            item.Assignee.AvatarType,
                            item.Assignee.Id,
                            item.Assignee.Username,
                            item.Assignee.Email,
                            item.Assignee.AvatarUrl
                        )
                        : null,
                Priority = item.Priority,
                DueDate = item.DueDate,
                IsArchived = item.IsArchived,
                IsDraft = item.IsDraft,
                CommitterId = item.CommitterId,
                CommitterUsername = item.Committer?.Username,
                CommitterAvatarUrl =
                    item.Committer != null
                        ? IdentityIconHelper.GetIdentityIconUrl(
                            item.Committer.AvatarType,
                            item.Committer.Id,
                            item.Committer.Username,
                            item.Committer.Email,
                            item.Committer.AvatarUrl
                        )
                        : null,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt,
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
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースアイテム取得中にエラーが発生しました。ItemId: {ItemId}",
                itemId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
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
    public async Task<
        Results<Ok<PagedResponse<WorkspaceItemDetailResponse>>, StatusCodeHttpResult>
    > GetWorkspaceItems(
        int workspaceId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isDraft = null,
        [FromQuery] bool? isArchived = null,
        [FromQuery] int? assigneeId = null,
        [FromQuery] int? priority = null
    )
    {
        try
        {
            var (items, totalCount) = await _workspaceItemService.GetWorkspaceItemsAsync(
                workspaceId,
                page,
                pageSize,
                isDraft,
                isArchived,
                assigneeId,
                priority
            );

            var itemResponses = items
                .Select(item => new WorkspaceItemDetailResponse
                {
                    Id = item.Id,
                    WorkspaceId = item.WorkspaceId,
                    WorkspaceName = item.Workspace?.Name,
                    Code = item.Code,
                    Subject = item.Subject,
                    Body = item.Body,
                    OwnerId = item.OwnerId,
                    OwnerUsername = item.Owner?.Username,
                    OwnerAvatarUrl =
                        item.Owner != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Owner.AvatarType,
                                item.Owner.Id,
                                item.Owner.Username,
                                item.Owner.Email,
                                item.Owner.AvatarUrl
                            )
                            : null,
                    AssigneeId = item.AssigneeId,
                    AssigneeUsername = item.Assignee?.Username,
                    AssigneeAvatarUrl =
                        item.Assignee != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Assignee.AvatarType,
                                item.Assignee.Id,
                                item.Assignee.Username,
                                item.Assignee.Email,
                                item.Assignee.AvatarUrl
                            )
                            : null,
                    Priority = item.Priority,
                    DueDate = item.DueDate,
                    IsArchived = item.IsArchived,
                    IsDraft = item.IsDraft,
                    CommitterId = item.CommitterId,
                    CommitterUsername = item.Committer?.Username,
                    CommitterAvatarUrl =
                        item.Committer != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Committer.AvatarType,
                                item.Committer.Id,
                                item.Committer.Username,
                                item.Committer.Email,
                                item.Committer.AvatarUrl
                            )
                            : null,
                    CreatedAt = item.CreatedAt,
                    UpdatedAt = item.UpdatedAt,
                })
                .ToList();

            var response = PaginationHelper.CreatePagedResponse(
                itemResponses,
                page,
                pageSize,
                totalCount
            );

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ワークスペースアイテム一覧取得中にエラーが発生しました。WorkspaceId: {WorkspaceId}",
                workspaceId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテム更新
    /// </summary>
    [HttpPatch("{itemId}")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UpdateWorkspaceItem(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemRequest request
    )
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!currentUserId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            var item = await _workspaceItemService.UpdateWorkspaceItemAsync(
                workspaceId,
                itemId,
                request,
                currentUserId.Value
            );

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "ワークスペースアイテムを更新しました。",
                WorkspaceItem = new WorkspaceItemDetailResponse
                {
                    Id = item.Id,
                    WorkspaceId = item.WorkspaceId,
                    WorkspaceName = item.Workspace?.Name,
                    Code = item.Code,
                    Subject = item.Subject,
                    Body = item.Body,
                    OwnerId = item.OwnerId,
                    OwnerUsername = item.Owner?.Username,
                    OwnerAvatarUrl =
                        item.Owner != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Owner.AvatarType,
                                item.Owner.Id,
                                item.Owner.Username,
                                item.Owner.Email,
                                item.Owner.AvatarUrl
                            )
                            : null,
                    AssigneeId = item.AssigneeId,
                    AssigneeUsername = item.Assignee?.Username,
                    AssigneeAvatarUrl =
                        item.Assignee != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Assignee.AvatarType,
                                item.Assignee.Id,
                                item.Assignee.Username,
                                item.Assignee.Email,
                                item.Assignee.AvatarUrl
                            )
                            : null,
                    Priority = item.Priority,
                    DueDate = item.DueDate,
                    IsArchived = item.IsArchived,
                    IsDraft = item.IsDraft,
                    CommitterId = item.CommitterId,
                    CommitterUsername = item.Committer?.Username,
                    CommitterAvatarUrl =
                        item.Committer != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Committer.AvatarType,
                                item.Committer.Id,
                                item.Committer.Username,
                                item.Committer.Email,
                                item.Committer.AvatarUrl
                            )
                            : null,
                    CreatedAt = item.CreatedAt,
                    UpdatedAt = item.UpdatedAt,
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
                "ワークスペースアイテム更新中にエラーが発生しました。ItemId: {ItemId}",
                itemId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテムステータス更新
    /// </summary>
    [HttpPatch("{itemId}/status")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<WorkspaceItemResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UpdateWorkspaceItemStatus(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemStatusRequest request
    )
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!currentUserId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            var item = await _workspaceItemService.UpdateWorkspaceItemStatusAsync(
                workspaceId,
                itemId,
                request,
                currentUserId.Value
            );

            var response = new WorkspaceItemResponse
            {
                Success = true,
                Message = "ワークスペースアイテムのステータスを更新しました。",
                WorkspaceItem = new WorkspaceItemDetailResponse
                {
                    Id = item.Id,
                    WorkspaceId = item.WorkspaceId,
                    WorkspaceName = item.Workspace?.Name,
                    Code = item.Code,
                    Subject = item.Subject,
                    Body = item.Body,
                    OwnerId = item.OwnerId,
                    OwnerUsername = item.Owner?.Username,
                    OwnerAvatarUrl =
                        item.Owner != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Owner.AvatarType,
                                item.Owner.Id,
                                item.Owner.Username,
                                item.Owner.Email,
                                item.Owner.AvatarUrl
                            )
                            : null,
                    AssigneeId = item.AssigneeId,
                    AssigneeUsername = item.Assignee?.Username,
                    AssigneeAvatarUrl =
                        item.Assignee != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Assignee.AvatarType,
                                item.Assignee.Id,
                                item.Assignee.Username,
                                item.Assignee.Email,
                                item.Assignee.AvatarUrl
                            )
                            : null,
                    Priority = item.Priority,
                    DueDate = item.DueDate,
                    IsArchived = item.IsArchived,
                    IsDraft = item.IsDraft,
                    CommitterId = item.CommitterId,
                    CommitterUsername = item.Committer?.Username,
                    CommitterAvatarUrl =
                        item.Committer != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                item.Committer.AvatarType,
                                item.Committer.Id,
                                item.Committer.Username,
                                item.Committer.Email,
                                item.Committer.AvatarUrl
                            )
                            : null,
                    CreatedAt = item.CreatedAt,
                    UpdatedAt = item.UpdatedAt,
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
                "ワークスペースアイテムステータス更新中にエラーが発生しました。ItemId: {ItemId}",
                itemId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ワークスペースアイテム削除
    /// </summary>
    [HttpDelete("{itemId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<SuccessResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > DeleteWorkspaceItem(int workspaceId, int itemId)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            int? currentUserId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            }

            if (!currentUserId.HasValue)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = "認証が必要です。",
                    }
                );
            }

            await _workspaceItemService.DeleteWorkspaceItemAsync(
                workspaceId,
                itemId,
                currentUserId.Value
            );

            var response = new SuccessResponse
            {
                StatusCode = StatusCodes.Status200OK,
                Message = "ワークスペースアイテムを削除しました。",
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
                "ワークスペースアイテム削除中にエラーが発生しました。ItemId: {ItemId}",
                itemId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
