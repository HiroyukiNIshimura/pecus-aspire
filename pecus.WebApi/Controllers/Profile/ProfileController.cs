using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.Mail.Services;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.User;
using Pecus.Services;

namespace Pecus.Controllers.Profile;

/// <summary>
/// プロフィール管理コントローラー
/// </summary>
[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProfileController> _logger;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;
    private readonly ProfileService _profileService;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ProfileController(
        UserService userService,
        ApplicationDbContext context,
        ILogger<ProfileController> logger,
        IBackgroundJobClient backgroundJobClient,
        IEmailService emailService,
        IConfiguration config,
        ProfileService profileService
    )
    {
        _userService = userService;
        _context = context;
        _logger = logger;
        _backgroundJobClient = backgroundJobClient;
        _emailService = emailService;
        _config = config;
        _profileService = profileService;
    }

    /// <summary>
    /// 自分のプロフィール情報を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<UserResponse>, NotFound, StatusCodeHttpResult>
    > GetProfile()
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var user = await _userService.GetUserByIdAsync(me);
            if (user == null)
            {
                return TypedResults.NotFound();
            }

            var response = new UserResponse
            {
                Id = user.Id,
                LoginId = user.LoginId,
                Username = user.Username,
                Email = user.Email,
                AvatarType = user.AvatarType,
                IdentityIconUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt,
                Roles = user.Roles?
                    .Select(r => new UserRoleResponse
                    {
                        Id = r.Id,
                        Name = r.Name,
                    })
                    .ToList() ?? new List<UserRoleResponse>(),
                Skills = user.UserSkills?
                    .Select(us => new UserSkillResponse
                    {
                        Id = us.Skill.Id,
                        Name = us.Skill.Name,
                    })
                    .ToList() ?? new List<UserSkillResponse>(),
                IsAdmin = user.Roles?.Any(r => r.Name == "Admin") ?? false,
                IsActive = user.IsActive,
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "プロフィール情報取得中にエラーが発生しました。UserId: {UserId}", JwtBearerUtil.GetUserIdFromPrincipal(User));
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 自分のプロフィール情報を更新
    /// </summary>
    /// <param name="request">更新情報</param>
    /// <returns>更新結果</returns>
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok, BadRequest<ErrorResponse>, NotFound, StatusCodeHttpResult>
    > UpdateProfile(
        UpdateProfileRequest request
    )
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // バリデーション: AvatarType="user-avatar"の場合、AvatarUrlが必須
            if (request.AvatarType == "user-avatar" && string.IsNullOrWhiteSpace(request.AvatarUrl))
            {
                return TypedResults.BadRequest(new ErrorResponse
                {
                    Message = "AvatarType が 'user-avatar' の場合、AvatarUrl は必須です。"
                });
            }

            var updatedUser = await _userService.UpdateProfileAsync(me, request, me);
            if (updatedUser == null)
            {
                return TypedResults.NotFound();
            }

            _logger.LogInformation("ユーザープロフィールを更新しました。UserId: {UserId}", me);
            return TypedResults.Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "プロフィール更新中にエラーが発生しました。UserId: {UserId}", JwtBearerUtil.GetUserIdFromPrincipal(User));
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// メールアドレスを変更
    /// </summary>
    /// <param name="request">変更情報</param>
    /// <returns>結果</returns>
    [HttpPatch("email")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<MessageResponse>, BadRequest<ErrorResponse>, NotFound, StatusCodeHttpResult>
    > UpdateEmail(UpdateEmailRequest request)
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // 新しいメールアドレスが現在のものと同じかチェック
            var user = await _userService.GetUserByIdAsync(me);
            if (user == null)
            {
                return TypedResults.NotFound();
            }

            if (user.Email.Equals(request.NewEmail, StringComparison.OrdinalIgnoreCase))
            {
                return TypedResults.BadRequest(new ErrorResponse
                {
                    Message = "新しいメールアドレスは現在のメールアドレスと異なっている必要があります。"
                });
            }

            // 新しいメールアドレスが既に使用されていないかチェックとDB更新
            var updateResult = await _profileService.UpdateEmailAsync(me, request.NewEmail);
            if (!updateResult)
            {
                return TypedResults.BadRequest(new ErrorResponse
                {
                    Message = "このメールアドレスは既に使用されています。"
                });
            }

            _logger.LogInformation("メールアドレスを変更しました。UserId: {UserId}, NewEmail: {NewEmail}", me, request.NewEmail);

            return TypedResults.Ok(new MessageResponse { Message = "メールアドレスを変更しました。" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "メールアドレス変更中にエラーが発生しました。UserId: {UserId}", JwtBearerUtil.GetUserIdFromPrincipal(User));
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 自分の有効なデバイス情報の一覧を取得
    /// </summary>
    [HttpGet("devices")]
    [ProducesResponseType(typeof(List<DeviceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<List<DeviceResponse>>, NotFound, StatusCodeHttpResult>
    > GetDevices()
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var response = await _profileService.GetUserDevicesAsync(me);

            if (response == null || response.Count == 0)
            {
                return TypedResults.NotFound();
            }

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "デバイス情報取得中にエラーが発生しました。UserId: {UserId}", JwtBearerUtil.GetUserIdFromPrincipal(User));
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}