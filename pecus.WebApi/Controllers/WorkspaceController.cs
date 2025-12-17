using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
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
    /// ワークスペースを新規作成する
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
        var response = await _workspaceService.GetWorkspaceDetailAsync(workspace.Id, CurrentUserId);

        return TypedResults.Created($"/api/workspaces/{response.Id}", response);
    }

    /// <summary>
    /// ワークスペース情報を更新する（Member以上の権限が必要）
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
        // ワークスペース編集権限チェック（Member以上）
        await _workspaceService.CheckWorkspaceMemberOrOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // ワークスペースを更新
        await _workspaceService.UpdateWorkspaceAsync(
            workspaceId: id,
            request: request,
            updatedByUserId: CurrentUserId
        );

        // 更新後のワークスペース詳細情報を取得（currentUserIdを渡してCurrentUserRoleを設定）
        var response = await _workspaceService.GetWorkspaceDetailAsync(id, CurrentUserId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ログインユーザーがアクセス可能なワークスペース一覧を取得する（ページネーション）
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
                Mode = w.Mode,
                ActiveItemCount = w.WorkspaceItems?.Count(wi => wi.IsActive) ?? 0,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt,
                IsActive = w.IsActive,
                MemberCount = w.WorkspaceUsers?.Count ?? 0,
                Members = w.WorkspaceUsers?
                    .Where(wu => wu.User != null && wu.User.IsActive)
                    .Select(wu => new WorkspaceUserItem
                    {
                        UserId = wu.UserId,
                        Username = wu.User!.Username,
                        Email = wu.User.Email,
                        IdentityIconUrl = Libs.IdentityIconHelper.GetIdentityIconUrl(
                            iconType: wu.User.AvatarType,
                            userId: wu.User.Id,
                            username: wu.User.Username,
                            email: wu.User.Email,
                            avatarPath: wu.User.UserAvatarPath
                        ),
                        WorkspaceRole = wu.WorkspaceRole,
                        IsActive = wu.User.IsActive,
                        LastLoginAt = wu.User.LastLoginAt,
                    })
                    .ToList(),
                Owner = w.Owner != null
                    ? new WorkspaceUserItem
                    {
                        UserId = w.Owner.Id,
                        Username = w.Owner.Username,
                        Email = w.Owner.Email,
                        IdentityIconUrl = Libs.IdentityIconHelper.GetIdentityIconUrl(
                            iconType: w.Owner.AvatarType,
                            userId: w.Owner.Id,
                            username: w.Owner.Username,
                            email: w.Owner.Email,
                            avatarPath: w.Owner.UserAvatarPath
                        ),
                        IsActive = w.Owner.IsActive,
                        LastLoginAt = w.Owner.LastLoginAt,
                    }
                    : null,
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
    /// ワークスペースの詳細情報を取得する（ログインユーザーがアクセス可能なもののみ）
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

        return await GetWorkspaceDetailResponseAsync(id);
    }

    /// <summary>
    /// ワークスペースの詳細情報を取得する（codeベース：ログインユーザーがアクセス可能なもののみ）
    /// </summary>
    /// <param name="code">ワークスペースコード</param>
    [HttpGet("code/{code}")]
    [ProducesResponseType(typeof(WorkspaceFullDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceFullDetailResponse>> GetWorkspaceDetailByCode(string code)
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースアクセス権限チェック（codeからIDを解決）
        var workspaceId = await _workspaceService.CheckWorkspaceAccessByCodeAsync(code: code, userId: CurrentUserId);

        return await GetWorkspaceDetailResponseAsync(workspaceId);
    }

    /// <summary>
    /// ワークスペース詳細レスポンスを生成する（内部共通メソッド）
    /// </summary>
    private async Task<Ok<WorkspaceFullDetailResponse>> GetWorkspaceDetailResponseAsync(int workspaceId)
    {
        // ワークスペース詳細情報を取得（ログインユーザーのロールも含む）
        var response = await _workspaceService.GetWorkspaceDetailAsync(workspaceId, CurrentUserId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースにメンバーを追加する（Ownerのみ実行可能）
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
            request: request
        );

        var response = new WorkspaceUserDetailResponse
        {
            WorkspaceId = workspaceUser.WorkspaceId,
            UserId = workspaceUser.UserId,
            Username = workspaceUser.User?.Username ?? "",
            Email = workspaceUser.User?.Email ?? "",
            IdentityIconUrl = Libs.IdentityIconHelper.GetIdentityIconUrl(
                iconType: workspaceUser.User?.AvatarType,
                userId: workspaceUser.UserId,
                username: workspaceUser.User?.Username ?? "",
                email: workspaceUser.User?.Email ?? "",
                avatarPath: workspaceUser.User?.UserAvatarPath
            ),
            WorkspaceRole = workspaceUser.WorkspaceRole,
            JoinedAt = workspaceUser.JoinedAt,
            LastAccessedAt = workspaceUser.LastAccessedAt,
            IsActive = workspaceUser.User?.IsActive ?? false,
        };

        return TypedResults.Created($"/api/workspaces/{id}/members/{workspaceUser.UserId}", response);
    }

    /// <summary>
    /// ワークスペースからメンバーを削除する（Ownerまたは自分自身の場合のみ実行可能）
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
    /// ワークスペースメンバーのロールを変更する（Ownerのみ実行可能）
    /// </summary>
    /// <remarks>
    /// ワークスペースの Owner ロールを持つユーザーのみ実行可能です。
    /// ただし、Workspace.OwnerId のユーザーを Owner 以外のロールに変更することはできません。
    /// </remarks>
    /// <param name="id">ワークスペースID</param>
    /// <param name="userId">対象ユーザーID</param>
    /// <param name="request">ロール変更リクエスト</param>
    [HttpPatch("{id:int}/members/{userId:int}/role")]
    [ProducesResponseType(typeof(WorkspaceUserDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceUserDetailResponse>> UpdateWorkspaceMemberRole(
        int id,
        int userId,
        [FromBody] UpdateWorkspaceUserRoleRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースオーナー権限チェック
        await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // ロール変更実行
        var workspaceUser = await _workspaceService.UpdateWorkspaceUserRoleAsync(
            workspaceId: id,
            userId: userId,
            newRole: request.WorkspaceRole
        );

        var response = new WorkspaceUserDetailResponse
        {
            WorkspaceId = workspaceUser.WorkspaceId,
            UserId = workspaceUser.UserId,
            Username = workspaceUser.User?.Username ?? "",
            Email = workspaceUser.User?.Email ?? "",
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: workspaceUser.User?.AvatarType,
                userId: workspaceUser.UserId,
                username: workspaceUser.User?.Username ?? "",
                email: workspaceUser.User?.Email ?? "",
                avatarPath: workspaceUser.User?.UserAvatarPath
            ),
            WorkspaceRole = workspaceUser.WorkspaceRole,
            JoinedAt = workspaceUser.JoinedAt,
            LastAccessedAt = workspaceUser.LastAccessedAt,
            IsActive = workspaceUser.User?.IsActive ?? false,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースを有効化する（Ownerのみ実行可能）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="rowVersion">楽観的ロック用のバージョン番号</param>
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
        // ワークスペースオーナー権限チェック
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
        var response = await _workspaceService.GetWorkspaceDetailAsync(id, CurrentUserId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースを無効化する（Ownerのみ実行可能）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="rowVersion">楽観的ロック用のバージョン番号</param>
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
        // ワークスペースオーナー権限チェック
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
        var response = await _workspaceService.GetWorkspaceDetailAsync(id, CurrentUserId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースを削除する（Admin権限が必要）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> DeleteWorkspace(int id)
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // Admin権限チェック
        RequireAdminRole();

        // ワークスペースを削除
        var result = await _workspaceService.DeleteWorkspaceAsync(workspaceId: id);

        if (!result)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        return TypedResults.NoContent();
    }

    /// <summary>
    /// ワークスペースのスキルを設定する（Ownerのみ実行可能）
    /// </summary>
    /// <remarks>
    /// ワークスペースが必要とするスキルを設定します（洗い替え）。
    /// 指定されたスキル以外のスキルは削除されます。
    /// </remarks>
    /// <param name="id">ワークスペースID</param>
    /// <param name="request">スキルIDのリスト</param>
    /// <response code="200">スキルを設定しました</response>
    /// <response code="400">リクエストが無効です</response>
    /// <response code="404">ワークスペースが見つかりません</response>
    /// <response code="409">競合: ワークスペース情報が別のユーザーにより更新されています</response>
    [HttpPut("{id:int}/skills")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> SetWorkspaceSkills(
        int id,
        [FromBody] SetWorkspaceSkillsRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースOwner権限チェック
        await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // スキルを設定
        var result = await _workspaceService.SetWorkspaceSkillsAsync(
            workspaceId: id,
            skillIds: request.SkillIds,
            rowVersion: request.RowVersion,
            updatedByUserId: CurrentUserId
        );

        if (!result)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        return TypedResults.Ok(new SuccessResponse { Message = "スキルを設定しました。" });
    }
}