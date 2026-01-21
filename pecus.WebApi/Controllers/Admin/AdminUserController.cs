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
using Pecus.Models.Requests.User;
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
    private readonly ChatRoomService _chatRoomService;
    private readonly ILogger<AdminUserController> _logger;
    private readonly PecusConfig _config;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly FrontendUrlResolver _frontendUrlResolver;
    private readonly OrganizationAccessHelper _accessHelper;

    public AdminUserController(
        UserService userService,
        RoleService roleService,
        OrganizationService organizationService,
        ChatRoomService chatRoomService,
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
        _chatRoomService = chatRoomService;
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
        // ログインユーザーと同じ組織に所属しているか確認（関連データを含む）
        var targetUser = await _userService.GetUserByIdForAdminAsync(id, CurrentOrganizationId);

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
            IsAdmin = targetUser.Roles?.Any(r => r.Name == SystemRole.Admin || r.Name == SystemRole.BackOffice) ?? false,
            IsActive = targetUser.IsActive,
            BackupEmail = targetUser.BackupEmail,
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
                BadgeVisibility = targetUser.Setting?.BadgeVisibility,
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
        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        (List<User> users, int totalCount) = await _userService.GetUsersByOrganizationPagedAsync(
            organizationId: CurrentOrganizationId,
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
            IsAdmin = u.Roles?.Any(r => r.Name == SystemRole.Admin || r.Name == SystemRole.BackOffice) ?? false,
            IsActive = u.IsActive,
            BackupEmail = u.BackupEmail,
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
                BadgeVisibility = u.Setting?.BadgeVisibility,
                RowVersion = u.Setting?.RowVersion ?? 0,
            },
        });

        // 統計情報を取得
        var statistics = await _userService.GetUserStatisticsByOrganizationAsync(
            CurrentOrganizationId
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
    /// ユーザー情報を更新（管理者用）
    /// </summary>
    /// <remarks>
    /// <para>
    /// 管理者がユーザー情報を一括更新します。
    /// ユーザー名、アクティブ状態、スキル、ロールを1トランザクションで更新します。
    /// </para>
    /// <para>
    /// <strong>楽観的ロック</strong>：RowVersionを使用して競合を検出します。
    /// 別のユーザーが同時に更新した場合は409エラーを返します。
    /// </para>
    /// </remarks>
    /// <param name="id">ユーザーID</param>
    /// <param name="request">更新リクエスト</param>
    /// <response code="200">ユーザー情報を更新しました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    /// <response code="409">競合: ユーザー情報が別のユーザーにより更新されています</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(UserDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<UserDetailResponse>), StatusCodes.Status409Conflict)]
    public async Task<Ok<UserDetailResponse>> UpdateUser(
        int id,
        [FromBody] AdminUpdateUserRequest request
    )
    {
        // ログインユーザーと同じ組織に所属しているか確認
        await _accessHelper.CheckIncludeOrganizationAllAsync(id, CurrentOrganizationId);

        var user = await _userService.AdminUpdateUserAsync(id, request, CurrentUserId);

        _logger.LogDebug(
            "管理者がユーザー情報を更新しました。AdminId: {AdminId}, TargetUserId: {TargetUserId}",
            CurrentUserId,
            id
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
            LastLoginAt = user.LastLoginAt,
            RowVersion = user.RowVersion,
            Roles = user.Roles?
                .Select(r => new UserRoleResponse
                {
                    Id = r.Id,
                    Name = r.Name,
                })
                .ToList() ?? [],
            Skills = user.UserSkills?
                .Select(us => new UserSkillResponse
                {
                    Id = us.Skill.Id,
                    Name = us.Skill.Name,
                })
                .ToList() ?? [],
            IsAdmin = user.Roles?.Any(r => r.Name == SystemRole.Admin || r.Name == SystemRole.BackOffice) ?? false,
            IsActive = user.IsActive,
            BackupEmail = user.BackupEmail,
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
                BadgeVisibility = user.Setting?.BadgeVisibility,
                RowVersion = user.Setting?.RowVersion ?? 0,
            },
        };

        return TypedResults.Ok(response);
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
        // パスワードなしでユーザーを作成（ロール設定、UserSetting、ChatActor を含む）
        var user = await _userService.CreateUserWithoutPasswordAsync(request, CurrentOrganizationId, CurrentUserId);

        // グループルームとシステムルームにメンバーとして追加
        await _chatRoomService.AddUserToOrganizationRoomsAsync(user.Id, CurrentOrganizationId);

        // 組織情報を取得
        var organization = await _organizationService.GetOrganizationByIdAsync(
            CurrentOrganizationId
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
                organization.Id,
                user.Email,
                "パスワード設定のお知らせ",
                new PasswordSetupEmailModel
                {
                    UserName = user.Username,
                    Email = user.Email,
                    LoginId = user.LoginId,
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
            BackupEmail = user.BackupEmail,
            Roles = user.Roles?
                .Select(r => new UserRoleResponse
                {
                    Id = r.Id,
                    Name = r.Name,
                })
                .ToList() ?? new List<UserRoleResponse>(),
            Skills = new List<UserSkillResponse>(),
            IsAdmin = user.Roles?.Any(r => r.Name == SystemRole.Admin || r.Name == SystemRole.BackOffice) ?? false,
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
                BadgeVisibility = user.Setting?.BadgeVisibility,
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
        // ログインユーザーと同じ組織に所属しているか確認
        var targetUser = await _accessHelper.CheckIncludeOrganizationAsync(id, CurrentOrganizationId);

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
                    CurrentOrganizationId,
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
    /// パスワード設定メールを再送（新規ユーザー用）
    /// </summary>
    /// <remarks>
    /// 新規作成時に送信されたパスワード設定メールを再送します。
    /// ユーザーがメールを紛失した場合などに使用します。
    /// トークンは再生成されます。
    /// </remarks>
    /// <param name="id">ユーザーID</param>
    /// <response code="200">パスワード設定メールが送信されました</response>
    /// <response code="400">パスワードが既に設定されています</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    [HttpPost("{id}/resend-password-setup")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<SuccessResponse>> ResendPasswordSetup(int id)
    {
        // ログインユーザーと同じ組織に所属しているか確認
        await _accessHelper.CheckIncludeOrganizationAsync(id, CurrentOrganizationId);

        // 新しいトークンを生成（ユーザー情報も取得）
        (bool success, User? user) = await _userService.RequestPasswordResetByUserIdAsync(id);
        if (!success || user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // パスワードが既に設定されている場合はエラー（空文字列はパスワード未設定）
        if (!string.IsNullOrEmpty(user.PasswordHash))
        {
            throw new InvalidOperationException("このユーザーは既にパスワードを設定済みです。パスワードリセット機能をご利用ください。");
        }

        // 組織情報を取得
        var organization = await _organizationService.GetOrganizationByIdAsync(CurrentOrganizationId);
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
                organization.Id,
                user.Email,
                "パスワード設定のお知らせ",
                new PasswordSetupEmailModel
                {
                    UserName = user.Username,
                    Email = user.Email,
                    LoginId = user.LoginId,
                    OrganizationName = organization.Name,
                    PasswordSetupUrl = passwordSetupUrl,
                    TokenExpiresAt = user.PasswordResetTokenExpiresAt!.Value,
                    CreatedAt = user.CreatedAt,
                }
            )
        );

        _logger.LogDebug(
            "管理者によるパスワード設定メール再送: AdminUserId={AdminUserId}, TargetUserId={TargetUserId}, TargetEmail={TargetEmail}",
            CurrentUserId,
            id,
            user.Email
        );

        return TypedResults.Ok(
            new SuccessResponse { Message = "パスワード設定メールを再送しました。" }
        );
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