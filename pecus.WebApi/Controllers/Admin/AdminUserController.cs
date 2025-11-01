using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Models.Config;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.User;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// ユーザー管理コントローラー（組織管理者用）
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class AdminUserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly OrganizationService _organizationService;
    private readonly ILogger<AdminUserController> _logger;
    private readonly PecusConfig _config;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AdminUserController(
        UserService userService,
        OrganizationService organizationService,
        ILogger<AdminUserController> logger,
        PecusConfig config,
        IBackgroundJobClient backgroundJobClient,
        IHttpContextAccessor httpContextAccessor
    )
    {
        _userService = userService;
        _organizationService = organizationService;
        _logger = logger;
        _config = config;
        _backgroundJobClient = backgroundJobClient;
        _httpContextAccessor = httpContextAccessor;
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
    [ProducesResponseType(typeof(PagedResponse<UserResponse, UserStatistics>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<PagedResponse<UserResponse, UserStatistics>>, NotFound<ErrorResponse>>> GetUsers(
        [FromQuery] GetUsersRequest request
    )
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ログインユーザーの組織IDを取得
            var user = await _userService.GetUserByIdAsync(me);
            if (user?.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "組織に所属していません。" }
                );
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

            var userResponses = users.Select(u => new UserResponse
            {
                Id = u.Id,
                LoginId = u.LoginId,
                Username = u.Username,
                Email = u.Email,
                AvatarType = u.AvatarType,
                IdentityIconUrl = u.AvatarUrl,
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
                IsActive = u.IsActive
            });

            // 統計情報を取得
            var statistics = await _userService.GetUserStatisticsByOrganizationAsync(user.OrganizationId.Value);

            var response = PaginationHelper.CreatePagedResponse(
                data: userResponses,
                totalCount: totalCount,
                page: validatedPage,
                pageSize: pageSize,
                summary: statistics
            );

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "組織内ユーザー一覧取得中にエラーが発生しました");
            throw;
        }
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
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, UnauthorizedHttpResult>
    > SetUserActiveStatus(int id, [FromBody] SetUserActiveStatusRequest request)
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // 操作対象ユーザーが同じ組織に所属しているか確認
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            var currentUser = await _userService.GetUserByIdAsync(me);
            if (currentUser?.OrganizationId != targetUser.OrganizationId)
            {
                return TypedResults.Unauthorized();
            }

            var result = await _userService.SetUserActiveStatusAsync(
                id,
                request.IsActive,
                me
            );
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            var message = request.IsActive
                ? "ユーザーを有効化しました。"
                : "ユーザーを無効化しました。";
            return TypedResults.Ok(new SuccessResponse { Message = message });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ユーザーアクティブ状態設定中にエラーが発生しました: UserId={UserId}",
                id
            );
            throw;
        }
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
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, UnauthorizedHttpResult>
    > DeleteUser(int id)
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // 操作対象ユーザーが同じ組織に所属しているか確認
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            var currentUser = await _userService.GetUserByIdAsync(me);
            if (currentUser?.OrganizationId != targetUser.OrganizationId)
            {
                return TypedResults.Unauthorized();
            }

            var result = await _userService.DeleteUserAsync(id);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            return TypedResults.Ok(new SuccessResponse { Message = "ユーザーを削除しました。" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ユーザー削除中にエラーが発生しました: UserId={UserId}", id);
            throw;
        }
    }

    /// <summary>
    /// ユーザーのスキルを設定
    /// </summary>
    /// <remarks>
    /// 指定したユーザーのスキルを設定します（洗い替え）。組織内のユーザーのみ操作可能です。
    /// </remarks>
    /// <param name="id">ユーザーID</param>
    /// <param name="request">スキルIDのリスト</param>
    /// <response code="200">スキルを設定しました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    [HttpPut("{id}/skills")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, UnauthorizedHttpResult>
    > SetUserSkills(int id, [FromBody] SetUserSkillsRequest request)
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // 操作対象ユーザーが同じ組織に所属しているか確認
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            var currentUser = await _userService.GetUserByIdAsync(me);
            if (currentUser?.OrganizationId != targetUser.OrganizationId)
            {
                return TypedResults.Unauthorized();
            }

            var result = await _userService.SetUserSkillsAsync(id, request.SkillIds, me);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            return TypedResults.Ok(new SuccessResponse { Message = "スキルを設定しました。" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "スキル設定中にエラーが発生しました: UserId={UserId}", id);
            throw;
        }
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
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<
        Results<Created<UserResponse>, BadRequest<ErrorResponse>, NotFound<ErrorResponse>>
    > CreateUserWithoutPassword([FromBody] CreateUserWithoutPasswordRequest request)
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ログインユーザーの組織IDを取得
            var currentUser = await _userService.GetUserByIdAsync(me);
            if (currentUser?.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "組織に所属していません。" }
                );
            }

            // パスワードなしでユーザーを作成
            var user = await _userService.CreateUserWithoutPasswordAsync(request, me);

            // 組織IDを設定（同じ組織に所属させる）
            user.OrganizationId = currentUser.OrganizationId;
            await _userService.UpdateUserAsync(user.Id, new UpdateUserRequest(), me);

            // 組織情報を取得
            var organization = await _organizationService.GetOrganizationByIdAsync(
                currentUser.OrganizationId.Value
            );
            if (organization == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "組織が見つかりません。" }
                );
            }

            // 動的にBaseUrlを取得
            var requestContext = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = requestContext != null ? $"{requestContext.Scheme}://{requestContext.Host}" : "https://localhost";

            // パスワード設定URLを生成
            var passwordSetupUrl =
                $"{baseUrl}/password-setup?token={user.PasswordResetToken}";

            // パスワード設定メールを送信
            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    user.Email,
                    "パスワード設定のお知らせ",
                    "password-setup",
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

            var response = new UserResponse
            {
                Id = user.Id,
                LoginId = user.LoginId,
                Username = user.Username,
                Email = user.Email,
                AvatarType = user.AvatarType,
                IdentityIconUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive,
                Skills = new List<UserSkillResponse>()
            };

            return TypedResults.Created($"/api/admin/users/{user.Id}", response);
        }
        catch (DuplicateException ex)
        {
            return TypedResults.BadRequest(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "パスワードなしユーザー作成中にエラーが発生しました");
            throw;
        }
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
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, UnauthorizedHttpResult>
    > RequestPasswordReset(int id)
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // 操作対象ユーザーが同じ組織に所属しているか確認
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            var currentUser = await _userService.GetUserByIdAsync(me);
            if (currentUser?.OrganizationId != targetUser.OrganizationId)
            {
                return TypedResults.Unauthorized();
            }

            (bool success, User? user) = await _userService.RequestPasswordResetByUserIdAsync(id);
            if (success && user != null)
            {
                // 動的にBaseUrlを取得
                var requestContext = _httpContextAccessor.HttpContext?.Request;
                var baseUrl = requestContext != null ? $"{requestContext.Scheme}://{requestContext.Host}" : "https://localhost";

                // パスワードリセットURLを構築
                var resetUrl =
                    $"{baseUrl}/password-reset?token={user.PasswordResetToken}";

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
                        "password-reset",
                        emailModel
                    )
                );

                _logger.LogInformation(
                    "管理者によるパスワードリセットリクエスト: AdminUserId={AdminUserId}, TargetUserId={TargetUserId}, TargetEmail={TargetEmail}",
                    me,
                    id,
                    user.Email
                );
            }

            return TypedResults.Ok(
                new SuccessResponse { Message = "パスワードリセットメールが送信されました。" }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "管理者によるパスワードリセットリクエスト中にエラーが発生しました: UserId={UserId}",
                id
            );
            throw;
        }
    }
}

/// <summary>
/// アクティブ状態設定リクエスト
/// </summary>
public class SetUserActiveStatusRequest
{
    /// <summary>
    /// アクティブ状態（true: 有効, false: 無効）
    /// </summary>
    public required bool IsActive { get; set; }
}

/// <summary>
/// スキル設定リクエスト
/// </summary>
public class SetUserSkillsRequest
{
    /// <summary>
    /// スキルIDのリスト
    /// </summary>
    public required List<int> SkillIds { get; set; }
}
