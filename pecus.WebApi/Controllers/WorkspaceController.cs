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
    /// ワークスペース新規作成
    /// </summary>
    /// <param name="request">ワークスペース作成リクエスト</param>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceFullDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<WorkspaceFullDetailResponse>> CreateWorkspace(
        [FromBody] CreateWorkspaceRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織情報が見つかりません。");
        }

        // ワークスペースを作成
        var workspace = await _workspaceService.CreateWorkspaceAsync(
            request: request,
            organizationId: CurrentUser.OrganizationId.Value,
            createdByUserId: CurrentUserId
        );

        // 作成されたワークスペースの詳細情報を取得
        (int id, string name, string code, string? description, DateTime createdAt,
            WorkspaceDetailUserResponse createdBy, DateTime? updatedAt,
            WorkspaceDetailUserResponse updatedBy, WorkspaceGenreResponse? genre,
            List<WorkspaceDetailUserResponse> members) =
            await _workspaceService.GetWorkspaceDetailAsync(workspace.Id);

        var response = new WorkspaceFullDetailResponse
        {
            Id = id,
            Name = name,
            Code = code,
            Description = description,
            GenreId = genre?.Id,
            GenreName = genre?.Name,
            GenreIcon = genre?.Icon,
            CreatedAt = createdAt,
            CreatedBy = createdBy,
            UpdatedAt = updatedAt,
            UpdatedBy = updatedBy,
            Members = members,
            IsActive = true,
            RowVersion = 0, // TODO: サービスから RowVersion を取得する必要あり
        };

        return TypedResults.Created($"/api/workspaces/{response.Id}", response);
    }

    /// <summary>
    /// ワークスペース情報を更新（Ownerのみ実行可能）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="request">ワークスペース更新リクエスト</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(WorkspaceFullDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceFullDetailResponse>> UpdateWorkspace(
        int id,
        [FromBody] UpdateWorkspaceRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースのオーナー権限チェック
        await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // ワークスペースを更新
        await _workspaceService.UpdateWorkspaceAsync(
            workspaceId: id,
            request: request,
            updatedByUserId: CurrentUserId
        );

        // 更新後のワークスペース詳細情報を取得
        (int wId, string name, string code, string? description, DateTime createdAt,
            WorkspaceDetailUserResponse createdBy, DateTime? updatedAt,
            WorkspaceDetailUserResponse updatedBy, WorkspaceGenreResponse? genre,
            List<WorkspaceDetailUserResponse> members) =
            await _workspaceService.GetWorkspaceDetailAsync(id);

        var response = new WorkspaceFullDetailResponse
        {
            Id = wId,
            Name = name,
            Code = code,
            Description = description,
            GenreId = genre?.Id,
            GenreName = genre?.Name,
            GenreIcon = genre?.Icon,
            CreatedAt = createdAt,
            CreatedBy = createdBy,
            UpdatedAt = updatedAt,
            UpdatedBy = updatedBy,
            Members = members,
            IsActive = true,
            RowVersion = 0, // TODO: サービスから RowVersion を取得する必要あり
        };

        return TypedResults.Ok(response);
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
        // CurrentUser は基底クラスで有効性チェック済み
        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        // ログインユーザーがアクセス可能なワークスペースを取得
        (var workspaces, int totalCount) =
            await _workspaceService.GetAccessibleWorkspacesByUserPagedAsync(
                userId: CurrentUserId,
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
        var statistics = await _workspaceService.GetAccessibleWorkspaceStatisticsAsync(CurrentUserId);

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
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースアクセス権限チェック
        await _workspaceService.CheckWorkspaceAccessAsync(workspaceId: id, userId: CurrentUserId);

        // ワークスペース詳細情報を取得
        var (wId, name, code, description, createdAt, createdBy, updatedAt, updatedBy, genre, members) =
            await _workspaceService.GetWorkspaceDetailAsync(id);

        var response = new WorkspaceFullDetailResponse
        {
            Id = wId,
            Name = name,
            Code = code,
            Description = description,
            GenreId = genre?.Id,
            GenreName = genre?.Name,
            GenreIcon = genre?.Icon,
            CreatedAt = createdAt,
            CreatedBy = createdBy,
            UpdatedAt = updatedAt,
            UpdatedBy = updatedBy,
            Members = members,
            IsActive = true,
            RowVersion = 0, // TODO: サービスから RowVersion を取得する必要あり
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
        [FromQuery] Models.Requests.Workspace.GetWorkspaceItemsRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースアクセス権限チェック
        await _workspaceService.CheckWorkspaceAccessAsync(workspaceId: id, userId: CurrentUserId);

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

    /// <summary>
    /// ワークスペースにメンバーを追加（Ownerのみ実行可能）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="request">メンバー追加リクエスト</param>
    [HttpPost("{id:int}/members")]
    [ProducesResponseType(typeof(WorkspaceUserDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<WorkspaceUserDetailResponse>> AddWorkspaceMember(
        int id,
        [FromBody] AddUserToWorkspaceRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースのオーナー権限チェック
        await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // メンバーを追加
        var workspaceUser = await _workspaceService.AddUserToWorkspaceAsync(
            workspaceId: id,
            request: request,
            invitedByUserId: CurrentUserId
        );

        var response = new WorkspaceUserDetailResponse
        {
            WorkspaceId = workspaceUser.WorkspaceId,
            UserId = workspaceUser.UserId,
            Username = workspaceUser.User?.Username,
            Email = workspaceUser.User?.Email,
            WorkspaceRole = workspaceUser.WorkspaceRole,
            JoinedAt = workspaceUser.JoinedAt,
            LastAccessedAt = workspaceUser.LastAccessedAt,
            IsActive = workspaceUser.User?.IsActive ?? false,
        };

        return TypedResults.Created($"/api/workspaces/{id}/members/{workspaceUser.UserId}", response);
    }

    /// <summary>
    /// ワークスペースからメンバーを削除（Ownerまたは自分自身の場合のみ実行可能）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="userId">削除するユーザーID</param>
    [HttpDelete("{id:int}/members/{userId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> RemoveWorkspaceMember(int id, int userId)
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // 自分自身を削除する場合は権限チェック不要（メンバーが自分で退出する場合）
        if (userId != CurrentUserId)
        {
            // 他のユーザーを削除する場合はオーナー権限が必要
            await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);
        }
        else
        {
            // 自分自身を削除する場合は、ワークスペースへのアクセス権限のみ確認
            await _workspaceService.CheckWorkspaceAccessAsync(workspaceId: id, userId: CurrentUserId);
        }

        // メンバーを削除
        var result = await _workspaceService.RemoveUserFromWorkspaceAsync(
            workspaceId: id,
            userId: userId
        );

        if (!result)
        {
            throw new NotFoundException("指定されたユーザーはワークスペースのメンバーではありません。");
        }

        return TypedResults.NoContent();
    }

    /// <summary>
    /// ワークスペースを有効化（Ownerのみ実行可能）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="rowVersion">楽観的ロック用バージョン番号</param>
    [HttpPost("{id:int}/activate")]
    [ProducesResponseType(typeof(WorkspaceFullDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceFullDetailResponse>> ActivateWorkspace(
        int id,
        [FromBody] uint rowVersion
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースのオーナー権限チェック
        await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // ワークスペースを有効化
        var result = await _workspaceService.ActivateWorkspaceAsync(
            workspaceId: id,
            rowVersion: rowVersion,
            updatedByUserId: CurrentUserId
        );

        if (!result)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // 更新後のワークスペース詳細情報を取得
        (int wId, string name, string code, string? description, DateTime createdAt,
            WorkspaceDetailUserResponse createdBy, DateTime? updatedAt,
            WorkspaceDetailUserResponse updatedBy, WorkspaceGenreResponse? genre,
            List<WorkspaceDetailUserResponse> members) =
            await _workspaceService.GetWorkspaceDetailAsync(id);

        var response = new WorkspaceFullDetailResponse
        {
            Id = wId,
            Name = name,
            Code = code,
            Description = description,
            GenreId = genre?.Id,
            GenreName = genre?.Name,
            GenreIcon = genre?.Icon,
            CreatedAt = createdAt,
            CreatedBy = createdBy,
            UpdatedAt = updatedAt,
            UpdatedBy = updatedBy,
            Members = members,
            IsActive = true,
            RowVersion = 0, // TODO: サービスから RowVersion を取得する必要あり
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースを無効化（Ownerのみ実行可能）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="rowVersion">楽観的ロック用バージョン番号</param>
    [HttpPost("{id:int}/deactivate")]
    [ProducesResponseType(typeof(WorkspaceFullDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceFullDetailResponse>> DeactivateWorkspace(
        int id,
        [FromBody] uint rowVersion
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースのオーナー権限チェック
        await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // ワークスペースを無効化
        var result = await _workspaceService.DeactivateWorkspaceAsync(
            workspaceId: id,
            rowVersion: rowVersion,
            updatedByUserId: CurrentUserId
        );

        if (!result)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // 更新後のワークスペース詳細情報を取得
        (int wId, string name, string code, string? description, DateTime createdAt,
            WorkspaceDetailUserResponse createdBy, DateTime? updatedAt,
            WorkspaceDetailUserResponse updatedBy, WorkspaceGenreResponse? genre,
            List<WorkspaceDetailUserResponse> members) =
            await _workspaceService.GetWorkspaceDetailAsync(id);

        var response = new WorkspaceFullDetailResponse
        {
            Id = wId,
            Name = name,
            Code = code,
            Description = description,
            GenreId = genre?.Id,
            GenreName = genre?.Name,
            GenreIcon = genre?.Icon,
            CreatedAt = createdAt,
            CreatedBy = createdBy,
            UpdatedAt = updatedAt,
            UpdatedBy = updatedBy,
            Members = members,
            IsActive = false,
            RowVersion = 0, // TODO: サービスから RowVersion を取得する必要あり
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースを削除（Ownerのみ実行可能）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> DeleteWorkspace(int id)
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースのオーナー権限チェック
        await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // ワークスペースを削除
        var result = await _workspaceService.DeleteWorkspaceAsync(workspaceId: id);

        if (!result)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        return TypedResults.NoContent();
    }
}
