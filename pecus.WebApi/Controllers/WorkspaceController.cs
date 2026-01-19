using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;
using Pecus.Models.Config;
using Pecus.Models.Responses.Dashboard;
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
    private readonly UserService _userService;
    private readonly ILogger<WorkspaceController> _logger;
    private readonly PecusConfig _config;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly FrontendUrlResolver _frontendUrlResolver;

    public WorkspaceController(
        WorkspaceService workspaceService,
        UserService userService,
        ProfileService profileService,
        ILogger<WorkspaceController> logger,
        PecusConfig config,
        IBackgroundJobClient backgroundJobClient,
        FrontendUrlResolver frontendUrlResolver
    ) : base(profileService, logger)
    {
        _workspaceService = workspaceService;
        _userService = userService;
        _logger = logger;
        _config = config;
        _backgroundJobClient = backgroundJobClient;
        _frontendUrlResolver = frontendUrlResolver;
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
        // ワークスペースを作成
        var workspace = await _workspaceService.CreateWorkspaceAsync(
            request: request,
            organizationId: CurrentOrganizationId,
            createdByUserId: CurrentUserId
        );

        // ワークスペース作成通知メールを送信
        await SendWorkspaceCreatedEmailAsync(workspace.Id, CurrentOrganizationId);

        // 作成されたワークスペースの詳細情報を取得
        var response = await _workspaceService.GetWorkspaceDetailAsync(workspace.Id, CurrentUserId);

        return TypedResults.Created($"/workspaces/{response.Code}", response);
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

        // 更新前のワークスペース情報を取得（変更内容比較用）
        var oldWorkspace = await _workspaceService.GetWorkspaceWithOrganizationForEmailAsync(id);

        // ワークスペースを更新
        await _workspaceService.UpdateWorkspaceAsync(
            workspaceId: id,
            request: request,
            updatedByUserId: CurrentUserId
        );

        // 更新後のワークスペース詳細情報を取得（currentUserIdを渡してCurrentUserRoleを設定）
        var response = await _workspaceService.GetWorkspaceDetailAsync(id, CurrentUserId);

        // ワークスペース更新通知メールを送信
        if (oldWorkspace != null)
        {
            await SendWorkspaceUpdatedEmailAsync(id, oldWorkspace, request);
        }

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ログインユーザーがアクセス可能なワークスペース一覧を取得する（ページネーション）
    /// </summary>
    /// <param name="request">ワークスペース一覧取得リクエスト</param>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceListItemResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceListItemResponse>>> GetAccessibleWorkspaces(
        [FromQuery] GetWorkspacesRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        // ログインユーザーがアクセス可能なワークスペースを取得（DTOで直接返却）
        (var workspaces, int totalCount) =
            await _workspaceService.GetAccessibleWorkspacesByUserPagedAsync(
                userId: CurrentUserId,
                page: validatedPage,
                pageSize: pageSize,
                genreId: request.GenreId,
                name: request.Name,
                mode: request.Mode
            );

        var response = PaginationHelper.CreatePagedResponse(
            data: workspaces,
            totalCount: totalCount,
            page: validatedPage,
            pageSize: pageSize
        );

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ログインユーザーがアクセス可能なワークスペースの統計情報を取得する
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(WorkspaceStatistics), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceStatistics>> GetAccessibleWorkspaceStatistics()
    {
        var statistics = await _workspaceService.GetAccessibleWorkspaceStatisticsAsync(CurrentUserId);
        return TypedResults.Ok(statistics);
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
        // ワークスペースのオーナー権限チェック（ワークスペース情報も同時に取得）
        var workspace = await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // メンバーを追加（権限チェック済みのワークスペースを渡して再検索を省略）
        var (workspaceUser, returnedWorkspace) = await _workspaceService.AddUserToWorkspaceAsync(
            workspaceId: id,
            request: request,
            verifiedWorkspace: workspace
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

        // ワークスペース参加通知メールを送信
        if (workspaceUser.User?.Email != null && returnedWorkspace != null)
        {
            var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
            var emailModel = new WorkspaceJoinedEmailModel
            {
                UserName = workspaceUser.User.Username,
                WorkspaceName = returnedWorkspace.Name,
                WorkspaceCode = returnedWorkspace.Code ?? "",
                InviterName = CurrentUser?.Username,
                JoinedAt = workspaceUser.JoinedAt,
                FrontendWorkspaceUrl = $"{baseUrl}/workspaces/{returnedWorkspace.Code ?? ""}",
            };

            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    CurrentOrganizationId,
                    workspaceUser.User.Email,
                    "ワークスペースへの参加のお知らせ",
                    emailModel
                )
            );
        }

        return TypedResults.Created($"/workspaces/{returnedWorkspace?.Code ?? ""}", response);
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
    /// また、Viewer に変更する場合、対象ユーザーが担当中のタスクやアイテムがあると変更できません。
    /// </remarks>
    /// <param name="id">ワークスペースID</param>
    /// <param name="userId">対象ユーザーID</param>
    /// <param name="request">ロール変更リクエスト</param>
    [HttpPatch("{id:int}/members/{userId:int}/role")]
    [ProducesResponseType(typeof(WorkspaceUserDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(WorkspaceMemberAssignmentsResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Results<Ok<WorkspaceUserDetailResponse>, Conflict<WorkspaceMemberAssignmentsResponse>>> UpdateWorkspaceMemberRole(
        int id,
        int userId,
        [FromBody] UpdateWorkspaceUserRoleRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // ワークスペースオーナー権限チェック（ワークスペース情報も同時に取得）
        var workspace = await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // Viewerへの変更時のみ、担当タスク/アイテムをチェック
        if (request.WorkspaceRole == WorkspaceRole.Viewer)
        {
            var assignments = await _workspaceService.GetMemberAssignmentsAsync(id, userId);
            if (assignments.HasAssignments)
            {
                // 担当があれば409 Conflictを返す（担当情報を含める）
                return TypedResults.Conflict(assignments);
            }
        }

        // ロール変更実行（権限チェック済みのワークスペースを渡して再検索を省略）
        var workspaceUser = await _workspaceService.UpdateWorkspaceUserRoleAsync(
            workspaceId: id,
            userId: userId,
            newRole: request.WorkspaceRole,
            verifiedWorkspace: workspace
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
    /// ワークスペースに閲覧メンバーとして参加する
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    [HttpPost("{id:int}/join")]
    [ProducesResponseType(typeof(WorkspaceUserDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<WorkspaceUserDetailResponse>> JoinWorkspace(
        int id
    )
    {
        var workspace = await _workspaceService.GetWorkspaceByIdAsync(id);
        if (workspace == null || !workspace.IsActive)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var existingUser = await _workspaceService.GetWorkspaceUserAsync(workspaceId: id, userId: CurrentUserId);
        if (existingUser != null)
        {
            throw new BadRequestException("既にワークスペースのメンバーです。");
        }

        // メンバーを追加（権限チェック済みのワークスペースを渡して再検索を省略）
        var (workspaceUser, returnedWorkspace) = await _workspaceService.AddUserToWorkspaceAsync(
            workspaceId: id,
            request: new AddUserToWorkspaceRequest
            {
                UserId = CurrentUserId,
                WorkspaceRole = WorkspaceRole.Viewer
            },
            verifiedWorkspace: workspace
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

        // ワークスペース参加通知メールを送信（オーナーへ）
        var owners = await _workspaceService.GetWorkspaceOwnersAsync(id);
        foreach (var owner in owners)
        {
            // ワークスペース参加通知メールを送信（オーナー全員に送信）
            if (owner.User.Email != null && returnedWorkspace != null)
            {
                var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
                var emailModel = new WorkspaceViewerJoinedEmailModel
                {
                    UserName = workspaceUser.User!.Username,
                    WorkspaceName = returnedWorkspace.Name,
                    WorkspaceCode = returnedWorkspace.Code ?? "",
                    JoinedAt = workspaceUser.JoinedAt,
                    FrontendWorkspaceUrl = $"{baseUrl}/workspaces/{returnedWorkspace.Code ?? ""}",
                };

                _backgroundJobClient.Enqueue<EmailTasks>(x =>
                    x.SendTemplatedEmailAsync(
                        CurrentOrganizationId,
                        owner.User.Email,
                        "ワークスペースへの閲覧者参加のお知らせ",
                        emailModel
                    )
                );
            }
        }

        return TypedResults.Created($"/workspaces/{returnedWorkspace?.Code ?? ""}", response);
    }

    /// <summary>
    /// ワークスペースのメンバーをあいまい検索する
    /// </summary>
    /// <remarks>
    /// ワークスペースに参加しているメンバーの中から、ユーザー名またはメールアドレスで
    /// あいまい検索を行います。pgroonga を使用しているため、日本語の漢字のゆらぎや
    /// タイポにも対応します。
    ///
    /// タスクの担当者選択など、編集権限が必要な場面では excludeViewer=true を指定して
    /// Viewer ロールのメンバーを除外できます。
    /// </remarks>
    /// <param name="id">ワークスペースID</param>
    /// <param name="request">検索リクエスト</param>
    [HttpGet("{id:int}/members/search")]
    [ProducesResponseType(typeof(List<UserSearchResultResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<List<UserSearchResultResponse>>> SearchWorkspaceMembers(
        int id,
        [FromQuery] SearchWorkspaceMembersRequest request
    )
    {
        // ワークスペースメンバーであることを確認（Viewer含む全ロールがアクセス可能）
        await _workspaceService.CheckWorkspaceAccessAsync(workspaceId: id, userId: CurrentUserId);

        // メンバー検索を実行（UserService の既存メソッドを利用）
        var users = await _userService.SearchUsersWithPgroongaAsync(
            organizationId: CurrentOrganizationId,
            searchQuery: request.Q,
            limit: request.Limit,
            workspaceId: id,
            excludeViewer: request.ExcludeViewer
        );

        var response = users.Select(u => new UserSearchResultResponse
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            AvatarType = u.AvatarType,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: u.AvatarType,
                userId: u.Id,
                username: u.Username,
                email: u.Email,
                avatarPath: u.UserAvatarPath
            ),
            Skills = u.UserSkills
                .Where(us => us.Skill != null && us.Skill.IsActive)
                .Select(us => new UserSearchSkillResponse
                {
                    Id = us.Skill!.Id,
                    Name = us.Skill.Name,
                })
                .OrderBy(s => s.Name)
                .ToList(),
        }).ToList();

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
        // ワークスペースオーナー権限チェック（ワークスペース情報も同時に取得）
        var workspace = await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // ワークスペースを有効化（権限チェック済みのワークスペースを渡して再検索を省略）
        var result = await _workspaceService.ActivateWorkspaceAsync(
            workspaceId: id,
            rowVersion: rowVersion,
            updatedByUserId: CurrentUserId,
            verifiedWorkspace: workspace
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
        // ワークスペースオーナー権限チェック（ワークスペース情報も同時に取得）
        var workspace = await _workspaceService.CheckWorkspaceOwnerAsync(workspaceId: id, userId: CurrentUserId);

        // ワークスペースを無効化（権限チェック済みのワークスペースを渡して再検索を省略）
        var result = await _workspaceService.DeactivateWorkspaceAsync(
            workspaceId: id,
            rowVersion: rowVersion,
            updatedByUserId: CurrentUserId,
            verifiedWorkspace: workspace
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

        // 削除前にワークスペース情報を取得（メール送信用）
        var workspace = await _workspaceService.GetWorkspaceWithOrganizationForEmailAsync(id);
        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ワークスペースを削除
        var result = await _workspaceService.DeleteWorkspaceAsync(workspaceId: id);

        if (!result)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ワークスペース削除通知メールを送信
        await SendWorkspaceDeletedEmailAsync(workspace);

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

    /// <summary>
    /// ワークスペース作成時に組織内ユーザーへメール送信
    /// </summary>
    private async Task SendWorkspaceCreatedEmailAsync(int workspaceId, int organizationId)
    {
        // ワークスペース情報を取得
        var workspace = await _workspaceService.GetWorkspaceWithOrganizationForEmailAsync(workspaceId);
        if (workspace == null)
        {
            _logger.LogWarning(
                "ワークスペース作成メール送信: ワークスペース情報が取得できませんでした。WorkspaceId={WorkspaceId}",
                workspaceId
            );
            return;
        }

        // 通知先ユーザー一覧を取得（組織内の有効なユーザー、作成者を除外）
        var targetUsers = await _workspaceService.GetWorkspaceCreationNotificationTargetsAsync(
            organizationId,
            CurrentUserId // ワークスペース作成者は除外
        );

        if (targetUsers.Count == 0)
        {
            _logger.LogInformation(
                "ワークスペース作成メール送信: 通知先ユーザーがいません。WorkspaceId={WorkspaceId}",
                workspaceId
            );
            return;
        }

        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
        var workspaceUrl = $"{baseUrl}/workspaces/{workspace.Code}";

        // 各ユーザーにメール送信ジョブを登録
        foreach (var user in targetUsers)
        {
            if (string.IsNullOrEmpty(user.Email))
            {
                continue;
            }

            var emailModel = new WorkspaceCreatedEmailModel
            {
                UserName = user.Username,
                WorkspaceName = workspace.Name,
                WorkspaceCode = workspace.Code ?? "",
                CategoryName = workspace.Genre?.Name,
                Description = workspace.Description,
                CreatedByName = CurrentUser?.Username ?? "",
                CreatedAt = workspace.CreatedAt,
                OrganizationName = workspace.Organization?.Name ?? "",
                WorkspaceUrl = workspaceUrl,
            };

            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    CurrentOrganizationId,
                    user.Email,
                    "新しいワークスペースが作成されました",
                    emailModel
                )
            );
        }

        _logger.LogInformation(
            "ワークスペース作成メールをキューに追加しました。WorkspaceId={WorkspaceId}, TargetCount={Count}",
            workspaceId,
            targetUsers.Count
        );
    }

    /// <summary>
    /// ワークスペース更新時に組織内ユーザーへメール送信
    /// </summary>
    private async Task SendWorkspaceUpdatedEmailAsync(
        int workspaceId,
        Workspace oldWorkspace,
        UpdateWorkspaceRequest request
    )
    {
        // 変更内容を検出
        var changes = new List<string>();
        string? oldName = null, newName = null;
        string? oldCategory = null, newCategory = null;
        string? oldDescription = null, newDescription = null;

        if (oldWorkspace.Name != request.Name)
        {
            changes.Add("名前を変更");
            oldName = oldWorkspace.Name;
            newName = request.Name;
        }

        if (oldWorkspace.GenreId != request.GenreId)
        {
            changes.Add("カテゴリを変更");
            oldCategory = oldWorkspace.Genre?.Name;
            newCategory = await _workspaceService.GetGenreNameAsync(request.GenreId);
        }

        if (oldWorkspace.Description != request.Description)
        {
            changes.Add("説明を変更");
            oldDescription = oldWorkspace.Description;
            newDescription = request.Description;
        }

        // 変更がない場合はメール送信しない
        if (changes.Count == 0)
        {
            _logger.LogInformation(
                "ワークスペース更新メール送信: 変更内容がありません。WorkspaceId={WorkspaceId}",
                workspaceId
            );
            return;
        }

        // 通知先ユーザー一覧を取得（組織内の有効なユーザー、更新者を除外）
        var targetUsers = await _workspaceService.GetWorkspaceCreationNotificationTargetsAsync(
            oldWorkspace.OrganizationId,
            CurrentUserId // ワークスペース更新者は除外
        );

        if (targetUsers.Count == 0)
        {
            _logger.LogInformation(
                "ワークスペース更新メール送信: 通知先ユーザーがいません。WorkspaceId={WorkspaceId}",
                workspaceId
            );
            return;
        }

        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
        var workspaceUrl = $"{baseUrl}/workspaces/{oldWorkspace.Code}";

        // 各ユーザーにメール送信ジョブを登録
        foreach (var user in targetUsers)
        {
            if (string.IsNullOrEmpty(user.Email))
            {
                continue;
            }

            var emailModel = new WorkspaceUpdatedEmailModel
            {
                UserName = user.Username,
                WorkspaceName = request.Name,
                WorkspaceCode = oldWorkspace.Code ?? "",
                UpdatedByName = CurrentUser?.Username ?? "",
                UpdatedAt = DateTimeOffset.UtcNow,
                Changes = changes,
                OldWorkspaceName = oldName,
                NewWorkspaceName = newName,
                OldCategoryName = oldCategory,
                NewCategoryName = newCategory,
                OldDescription = oldDescription,
                NewDescription = newDescription,
                OrganizationName = oldWorkspace.Organization?.Name ?? "",
                WorkspaceUrl = workspaceUrl,
            };

            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    CurrentOrganizationId,
                    user.Email,
                    "ワークスペースが更新されました",
                    emailModel
                )
            );
        }

        _logger.LogInformation(
            "ワークスペース更新メールをキューに追加しました。WorkspaceId={WorkspaceId}, Changes={Changes}, TargetCount={Count}",
            workspaceId,
            string.Join(", ", changes),
            targetUsers.Count
        );
    }

    /// <summary>
    /// ワークスペース削除時に組織内ユーザーへメール送信
    /// </summary>
    private async Task SendWorkspaceDeletedEmailAsync(Workspace workspace)
    {
        // 通知先ユーザー一覧を取得（組織内の有効なユーザー全員）
        var targetUsers = await _workspaceService.GetOrganizationActiveUsersAsync(workspace.OrganizationId);

        if (targetUsers.Count == 0)
        {
            _logger.LogInformation(
                "ワークスペース削除メール送信: 通知先ユーザーがいません。WorkspaceCode={WorkspaceCode}",
                workspace.Code
            );
            return;
        }

        // 各ユーザーにメール送信ジョブを登録
        foreach (var user in targetUsers)
        {
            if (string.IsNullOrEmpty(user.Email))
            {
                continue;
            }

            var emailModel = new WorkspaceDeletedEmailModel
            {
                UserName = user.Username,
                WorkspaceName = workspace.Name,
                WorkspaceCode = workspace.Code ?? "",
                CategoryName = workspace.Genre?.Name,
                DeletedByName = CurrentUser?.Username ?? "",
                DeletedAt = DateTimeOffset.UtcNow,
                OrganizationName = workspace.Organization?.Name ?? "",
            };

            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    CurrentOrganizationId,
                    user.Email,
                    "ワークスペースが削除されました",
                    emailModel
                )
            );
        }

        _logger.LogInformation(
            "ワークスペース削除メールをキューに追加しました。WorkspaceCode={WorkspaceCode}, TargetCount={Count}",
            workspace.Code,
            targetUsers.Count
        );
    }

    /// <summary>
    /// ワークスペースの週次タスクトレンドを取得（Viewer以上の権限が必要）
    /// </summary>
    /// <param name="id">ワークスペースID</param>
    /// <param name="weeks">取得する週数（4〜12週、デフォルト8週）</param>
    /// <returns>週次タスクトレンド</returns>
    [HttpGet("{id:int}/task-trend")]
    [ProducesResponseType(typeof(DashboardTaskTrendResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<DashboardTaskTrendResponse>, NotFound>> GetWorkspaceTaskTrend(
        int id,
        [FromQuery] int weeks = 8
    )
    {
        // ワークスペース閲覧権限チェック（Viewer以上）
        var workspace = await _workspaceService.GetWorkspaceDetailAsync(id, CurrentUserId);
        if (workspace == null)
        {
            return TypedResults.NotFound();
        }

        var clampedWeeks = Math.Clamp(weeks, 4, 12);
        var trend = await _workspaceService.GetWorkspaceTaskTrendAsync(id, clampedWeeks);

        return TypedResults.Ok(trend);
    }
}