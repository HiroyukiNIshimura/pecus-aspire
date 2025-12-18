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
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// ユーザー管理コントローラー（組織管理者用）
/// </summary>
[Route("api/admin/users")]
[Produces("application/json")]
[Tags("Admin - User")]
public class AdminUserController : BaseAdminController
{
    private readonly UserService _userService;
    private readonly RoleService _roleService;
    private readonly OrganizationService _organizationService;
    private readonly ILogger<AdminUserController> _logger;
    private readonly PecusConfig _config;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly FrontendUrlResolver _frontendUrlResolver;
    private readonly OrganizationAccessHelper _accessHelper;

    public AdminUserController(
        UserService userService,
        RoleService roleService,
        OrganizationService organizationService,
        ILogger<AdminUserController> logger,
        PecusConfig config,
        IBackgroundJobClient backgroundJobClient,
        FrontendUrlResolver frontendUrlResolver,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService

    ) : base(profileService, logger)
    {
        _userService = userService;
        _roleService = roleService;
        _organizationService = organizationService;
        _logger = logger;
        _config = config;
        _backgroundJobClient = backgroundJobClient;
        _frontendUrlResolver = frontendUrlResolver;
        _accessHelper = accessHelper;
    }

    /// <summary>
    /// 個別ユーザー情報を取得
    /// </summary>
    /// <remarks>
    /// 指定したユーザーの詳細情報を取得します。組織内のユーザーのみ取得可能です。
    /// </remarks>
    /// <param name="id">ユーザーID</param>
    /// <response code="200">ユーザー情報を返します</response>
    /// <response code="403">他組織のユーザーは取得できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UserDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<UserDetailResponse>> GetUserById(int id)
    {
        // 取得対象ユーザーが存在するか確認
        var targetUser = await _userService.GetUserByIdAsync(id);
        if (targetUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // ログインユーザーと同じ組織に所属しているか確認
        var canAccess = await _accessHelper.CanAccessUserAsync(CurrentUserId, id);
        if (!canAccess)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        var response = new UserDetailResponse
        {
            Id = targetUser.Id,
            OrganizationId = targetUser.OrganizationId,
            LoginId = targetUser.LoginId,
            Username = targetUser.Username,
            Email = targetUser.Email,
            AvatarType = targetUser.AvatarType,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: targetUser.AvatarType,
                userId: targetUser.Id,
                username: targetUser.Username,
                email: targetUser.Email,
                avatarPath: targetUser.UserAvatarPath
            ),
            CreatedAt = targetUser.CreatedAt,
            LastLoginAt = targetUser.LastLoginAt,
            RowVersion = targetUser.RowVersion!,
            Roles = targetUser.Roles?
                .Select(r => new UserRoleResponse
                {
                    Id = r.Id,
                    Name = r.Name,
                })
                .ToList() ?? new List<UserRoleResponse>(),
            Skills = targetUser.UserSkills?
                .Select(us => new UserSkillResponse
                {
                    Id = us.Skill.Id,
                    Name = us.Skill.Name,
                })
                .ToList() ?? new List<UserSkillResponse>(),
            IsAdmin = targetUser.Roles?.Any(r => r.Name == "Admin") ?? false,
            IsActive = targetUser.IsActive,
            Setting = new UserSettingResponse
            {
                CanReceiveEmail = targetUser.Setting?.CanReceiveEmail ?? true,
                CanReceiveRealtimeNotification = targetUser.Setting?.CanReceiveRealtimeNotification ?? true,
                TimeZone = targetUser.Setting?.TimeZone ?? "Asia/Tokyo",
                Language = targetUser.Setting?.Language ?? "ja-JP",
                LandingPage = targetUser.Setting?.LandingPage,
                FocusScorePriority = targetUser.Setting?.FocusScorePriority ?? FocusScorePriority.Deadline,
                FocusTasksLimit = targetUser.Setting?.FocusTasksLimit ?? 5,
                WaitingTasksLimit = targetUser.Setting?.WaitingTasksLimit ?? 5,
                RowVersion = targetUser.Setting?.RowVersion ?? 0,
            },
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 組織内のユーザー一覧を取得（ページング）
    /// </summary>
    /// <remarks>
    /// ログインユーザーの組織に所属するユーザーの一覧をページングで取得します。
    /// </remarks>
    /// <param name="request">ユーザー一覧取得リクエスト</param>
    /// <response code="200">ユーザー一覧を返します</response>
    /// <response code="404">組織が見つかりません</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<UserDetailResponse, UserStatistics>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<PagedResponse<UserDetailResponse, UserStatistics>>> GetUsers(
        [FromQuery] GetUsersRequest request
    )
    {
        // ログインユーザーの組織IDを取得
        var user = await _userService.GetUserByIdAsync(CurrentUserId);
        if (user?.OrganizationId == null)
        {
            throw new NotFoundException("組織に所属していません。");
        }

        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        (List<User> users, int totalCount) = await _userService.GetUsersByOrganizationPagedAsync(
            organizationId: user.OrganizationId.Value,
            page: validatedPage,
            pageSize: pageSize,
            isActive: request.IsActive,
            username: request.Username,
            skillIds: request.SkillIds,
            skillFilterMode: request.SkillFilterMode
        );

        var userResponses = users.Select(u => new UserDetailResponse
        {
            Id = u.Id,
            OrganizationId = u.OrganizationId,
            LoginId = u.LoginId,
            Username = u.Username,
            Email = u.Email,
            AvatarType = u.AvatarType,
            UserAvatarPath = u.UserAvatarPath,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: u.AvatarType,
                userId: u.Id,
                username: u.Username,
                email: u.Email,
                avatarPath: u.UserAvatarPath
            ),
            CreatedAt = u.CreatedAt,
            Roles = u.Roles?
                .Select(r => new UserRoleResponse
                {
                    Id = r.Id,
                    Name = r.Name,
                })
                .ToList() ?? new List<UserRoleResponse>(),
            Skills = u.UserSkills?
                .Select(us => new UserSkillResponse
                {
                    Id = us.Skill.Id,
                    Name = us.Skill.Name,
                })
                .ToList() ?? new List<UserSkillResponse>(),
            IsAdmin = u.Roles?.Any(r => r.Name == "Admin") ?? false,
            IsActive = u.IsActive,
            LastLoginAt = u.LastLoginAt,
            RowVersion = u.RowVersion!,
            Setting = new UserSettingResponse
            {
                CanReceiveEmail = u.Setting?.CanReceiveEmail ?? true,
                CanReceiveRealtimeNotification = u.Setting?.CanReceiveRealtimeNotification ?? true,
                TimeZone = u.Setting?.TimeZone ?? "Asia/Tokyo",
                Language = u.Setting?.Language ?? "ja-JP",
                LandingPage = u.Setting?.LandingPage,
                FocusScorePriority = u.Setting?.FocusScorePriority ?? FocusScorePriority.Deadline,
                FocusTasksLimit = u.Setting?.FocusTasksLimit ?? 5,
                WaitingTasksLimit = u.Setting?.WaitingTasksLimit ?? 5,
                RowVersion = u.Setting?.RowVersion ?? 0,
            },
        });

        // 統計情報を取得
        var statistics = await _userService.GetUserStatisticsByOrganizationAsync(
            user.OrganizationId.Value
        );

        var response = PaginationHelper.CreatePagedResponse(
            data: userResponses,
            totalCount: totalCount,
            page: validatedPage,
            pageSize: pageSize,
            summary: statistics
        );

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ユーザーのアクティブ状態を設定
    /// </summary>
    /// <remarks>
    /// 指定したユーザーのアクティブ状態を設定します。組織内のユーザーのみ操作可能です。
    /// </remarks>
    /// <param name="id">ユーザーID</param>
    /// <param name="request">アクティブ状態設定リクエスト</param>
    /// <response code="200">ユーザーのアクティブ状態を設定しました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    [HttpPut("{id}/active-status")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<UserDetailResponse>), StatusCodes.Status409Conflict)]
    public async Task<Ok<SuccessResponse>> SetUserActiveStatus(
        int id,
        [FromBody] SetUserActiveStatusRequest request
    )
    {
        // 操作対象ユーザーが存在するか確認
        var targetUser = await _userService.GetUserByIdAsync(id);
        if (targetUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // ログインユーザーと同じ組織に所属しているか確認
        var canAccess = await _accessHelper.CanAccessUserAsync(CurrentUserId, id);
        if (!canAccess)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        var result = await _userService.SetUserActiveStatusAsync(
            id,
            request.IsActive,
            CurrentUserId
        );
        if (!result)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        var message = request.IsActive
            ? "ユーザーを有効化しました。"
            : "ユーザーを無効化しました。";
        return TypedResults.Ok(new SuccessResponse { Message = message });
    }

    /// <summary>
    /// ユーザーを削除
    /// </summary>
    /// <remarks>
    /// 指定したユーザーを削除します。組織内のユーザーのみ操作可能です。
    /// </remarks>
    /// /// <param name="id">ユーザーID</param>
    /// <response code="200">ユーザーを削除しました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<SuccessResponse>> DeleteUser(int id)
    {
        // 操作対象ユーザーが存在するか確認
        var targetUser = await _userService.GetUserByIdAsync(id);
        if (targetUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // ログインユーザーと同じ組織に所属しているか確認
        var canAccess = await _accessHelper.CanAccessUserAsync(CurrentUserId, id);
        if (!canAccess)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        var result = await _userService.DeleteUserAsync(id);
        if (!result)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        return TypedResults.Ok(new SuccessResponse { Message = "ユーザーを削除しました。" });
    }

    /// <summary>
    /// ユーザーのスキルを設定（管理者が他のユーザーのスキルを管理）
    /// </summary>
    /// <remarks>
    /// <para>
    /// 管理者が組織内のユーザーのスキルを設定します（洗い替え）。
    /// 指定されたスキル以外は削除されます。
    /// </para>
    /// <para>
    /// <strong>重要</strong>：このエンドポイントは管理者による操作であり、
    /// ユーザーが自身のスキルを変更する場合は PUT /api/profile/skills を使用してください。
    /// </para>
    /// </remarks>
    /// <param name="id">対象ユーザーID</param>
    /// <param name="request">スキルIDのリスト</param>
    /// <response code="200">スキルを設定しました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    /// <response code="409">競合: スキル情報が別のユーザーにより更新されています</response>
    [HttpPut("{id}/skills")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<UserDetailResponse>), StatusCodes.Status409Conflict)]
    public async Task<Ok<SuccessResponse>> SetUserSkills(
        int id,
        [FromBody] SetUserSkillsRequest request
    )
    {
        // 操作対象ユーザーが存在するか確認
        var targetUser = await _userService.GetUserByIdAsync(id);
        if (targetUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // ログインユーザーと同じ組織に所属しているか確認
        var canAccess = await _accessHelper.CanAccessUserAsync(CurrentUserId, id);
        if (!canAccess)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // 管理者が別のユーザーのスキルを設定（洗い替え）
        // 操作実行者（me = 管理者）がスキル情報を変更
        var result = await _userService.SetUserSkillsAsync(
            userId: id,
            skillIds: request.SkillIds,
            userRowVersion: request.UserRowVersion,
            updatedByUserId: CurrentUserId
        );
        if (!result)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        _logger.LogDebug(
            "管理者がユーザーのスキルを更新しました。AdminId: {AdminId}, TargetUserId: {TargetUserId}, SkillCount: {SkillCount}",
            CurrentUserId,
            id,
            request.SkillIds?.Count ?? 0
        );

        return TypedResults.Ok(new SuccessResponse { Message = "スキルを設定しました。" });
    }

    /// <summary>
    /// パスワードなしでユーザーを作成
    /// </summary>
    /// <remarks>
    /// ユーザー名とメールアドレスのみでユーザーを作成します。パスワードは後で設定されます。
    /// 作成されたユーザーにはパスワード設定用のトークンが発行され、メールで通知されます。
    /// </remarks>
    /// <param name="request">ユーザー作成リクエスト</param>
    /// <response code="201">ユーザーが作成されました</response>
    /// <response code="400">リクエストが無効です</response>
    /// <response code="404">組織が見つかりません</response>
    [HttpPost("create-without-password")]
    [ProducesResponseType(typeof(UserDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Created<UserDetailResponse>> CreateUserWithoutPassword(
        [FromBody] CreateUserWithoutPasswordRequest request
    )
    {
        // ログインユーザーの組織IDを取得
        var currentUser = await _userService.GetUserByIdAsync(CurrentUserId);
        if (currentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織に所属していません。");
        }

        // パスワードなしでユーザーを作成（ロール設定を含む）
        var user = await _userService.CreateUserWithoutPasswordAsync(request, CurrentUserId);

        // 組織IDを設定（同じ組織に所属させる）
        user.OrganizationId = currentUser.OrganizationId;
        await _userService.UpdateUserAsync(user.Id, new UpdateUserRequest
        {
            Username = user.Username,
            AvatarType = AvatarType.AutoGenerated,
        }, CurrentUserId);

        // 組織情報を取得
        var organization = await _organizationService.GetOrganizationByIdAsync(
            currentUser.OrganizationId.Value
        );
        if (organization == null)
        {
            throw new NotFoundException("組織が見つかりません。");
        }

        // Aspire の Frontend:Endpoint からフロントエンドURLを取得
        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
        var passwordSetupUrl = $"{baseUrl}/password-setup?token={user.PasswordResetToken}";

        // パスワード設定メールを送信
        _backgroundJobClient.Enqueue<EmailTasks>(x =>
            x.SendTemplatedEmailAsync(
                user.Email,
                "パスワード設定のお知らせ",
                new PasswordSetupEmailModel
                {
                    UserName = user.Username,
                    Email = user.Email,
                    OrganizationName = organization.Name,
                    PasswordSetupUrl = passwordSetupUrl,
                    TokenExpiresAt = user.PasswordResetTokenExpiresAt!.Value,
                    CreatedAt = user.CreatedAt,
                }
            )
        );

        var response = new UserDetailResponse
        {
            Id = user.Id,
            OrganizationId = user.OrganizationId,
            LoginId = user.LoginId,
            Username = user.Username,
            Email = user.Email,
            AvatarType = user.AvatarType,
            UserAvatarPath = user.UserAvatarPath,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: user.AvatarType,
                userId: user.Id,
                username: user.Username,
                email: user.Email,
                avatarPath: user.UserAvatarPath
            ),
            CreatedAt = user.CreatedAt,
            IsActive = user.IsActive,
            Roles = user.Roles?
                .Select(r => new UserRoleResponse
                {
                    Id = r.Id,
                    Name = r.Name,
                })
                .ToList() ?? new List<UserRoleResponse>(),
            Skills = new List<UserSkillResponse>(),
            IsAdmin = user.Roles?.Any(r => r.Name == "Admin") ?? false,
            LastLoginAt = user.LastLoginAt,
            RowVersion = user.RowVersion!,
            Setting = new UserSettingResponse
            {
                CanReceiveEmail = user.Setting?.CanReceiveEmail ?? true,
                CanReceiveRealtimeNotification = user.Setting?.CanReceiveRealtimeNotification ?? true,
                TimeZone = user.Setting?.TimeZone ?? "Asia/Tokyo",
                Language = user.Setting?.Language ?? "ja-JP",
                LandingPage = user.Setting?.LandingPage,
                FocusScorePriority = user.Setting?.FocusScorePriority ?? FocusScorePriority.Deadline,
                FocusTasksLimit = user.Setting?.FocusTasksLimit ?? 5,
                WaitingTasksLimit = user.Setting?.WaitingTasksLimit ?? 5,
                RowVersion = user.Setting?.RowVersion ?? 0,
            },
        };

        return TypedResults.Created($"/api/admin/users/{user.Id}", response);
    }

    /// <summary>
    /// ユーザーのパスワードリセットをリクエスト
    /// </summary>
    /// <remarks>
    /// 指定したユーザーのパスワードリセットをリクエストします。組織内のユーザーのみ操作可能です。
    /// パスワードリセット用のメールがユーザーに送信されます。
    /// </remarks>
    /// <param name="id">ユーザーID</param>
    /// <response code="200">パスワードリセットメールが送信されました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    [HttpPost("{id}/request-password-reset")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<SuccessResponse>> RequestPasswordReset(int id)
    {
        // 操作対象ユーザーが存在するか確認
        var targetUser = await _userService.GetUserByIdAsync(id);
        if (targetUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // ログインユーザーと同じ組織に所属しているか確認
        var canAccess = await _accessHelper.CanAccessUserAsync(CurrentUserId, id);
        if (!canAccess)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        (bool success, User? user) = await _userService.RequestPasswordResetByUserIdAsync(id);
        if (success && user != null)
        {
            // Aspire の Frontend:Endpoint からフロントエンドURLを取得
            var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
            var resetUrl = $"{baseUrl}/password-reset?token={user.PasswordResetToken}";

            // パスワードリセットメールを送信
            var emailModel = new PasswordResetEmailModel
            {
                UserName = user.Username,
                Email = user.Email,
                PasswordResetUrl = resetUrl,
                TokenExpiresAt = user.PasswordResetTokenExpiresAt!.Value,
                RequestedAt = DateTime.UtcNow,
            };

            // バックグラウンドでメール送信
            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    user.Email,
                    "パスワードリセット",
                    emailModel
                )
            );

            _logger.LogDebug(
                "管理者によるパスワードリセットリクエスト: AdminUserId={AdminUserId}, TargetUserId={TargetUserId}, TargetEmail={TargetEmail}",
                CurrentUserId,
                id,
                user.Email
            );
        }

        return TypedResults.Ok(
            new SuccessResponse { Message = "パスワードリセットメールが送信されました。" }
        );
    }

    /// <summary>
    /// ユーザーのロールを設定（管理者が他のユーザーのロールを管理）
    /// </summary>
    /// <remarks>
    /// <para>
    /// 管理者が組織内のユーザーのロールを設定します（洗い替え）。
    /// 指定されたロール以外は削除されます。
    /// </para>
    /// <para>
    /// <strong>重要</strong>：このエンドポイントは管理者による操作です。
    /// ユーザーのロールはシステム管理者によってのみ変更されるべきです。
    /// </para>
    /// </remarks>
    /// <param name="id">対象ユーザーID</param>
    /// <param name="request">ロールIDのリスト</param>
    /// <response code="200">ロールを設定しました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    /// <response code="409">競合: ロール情報が別のユーザーにより更新されています</response>
    [HttpPut("{id}/roles")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<UserDetailResponse>), StatusCodes.Status409Conflict)]
    public async Task<Ok<SuccessResponse>> SetUserRoles(
        int id,
        [FromBody] SetUserRolesRequest request
    )
    {
        // 操作対象ユーザーが存在するか確認
        var targetUser = await _userService.GetUserByIdAsync(id);
        if (targetUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // ログインユーザーと同じ組織に所属しているか確認
        var canAccess = await _accessHelper.CanAccessUserAsync(CurrentUserId, id);
        if (!canAccess)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // 管理者が別のユーザーのロールを設定（洗い替え）
        // 操作実行者（me = 管理者）がロール情報を変更
        var result = await _userService.SetUserRolesAsync(
            userId: id,
            roleIds: request.Roles,
            userRowVersion: request.UserRowVersion,
            updatedByUserId: CurrentUserId
        );
        if (!result)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        _logger.LogDebug(
            "管理者がユーザーのロールを更新しました。AdminId: {AdminId}, TargetUserId: {TargetUserId}, RoleCount: {RoleCount}",
            CurrentUserId,
            id,
            request.Roles?.Count ?? 0
        );

        return TypedResults.Ok(new SuccessResponse { Message = "ロールを設定しました。" });
    }

    /// <summary>
    /// 全ロール一覧を取得
    /// </summary>
    /// <remarks>
    /// システム内の全ロール一覧を取得します。ユーザー設定画面で使用されます。
    /// </remarks>
    /// <response code="200">ロール一覧を返します</response>
    [HttpGet("roles")]
    [ProducesResponseType(
        typeof(List<RoleListItemResponse>),
        StatusCodes.Status200OK
    )]
    public async Task<Ok<List<RoleListItemResponse>>> GetRoles()
    {
        var roles = await _roleService.GetAllRolesAsync();
        var response = roles.Select(r => new RoleListItemResponse
        {
            Id = r.Id,
            Name = r.Name,
        }).ToList();

        return TypedResults.Ok(response);
    }
}