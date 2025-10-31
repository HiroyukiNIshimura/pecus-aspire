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

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ProfileController(
        UserService userService,
        ApplicationDbContext context,
        ILogger<ProfileController> logger,
        IBackgroundJobClient backgroundJobClient,
        IEmailService emailService,
        IConfiguration config
    )
    {
        _userService = userService;
        _context = context;
        _logger = logger;
        _backgroundJobClient = backgroundJobClient;
        _emailService = emailService;
        _config = config;
    }

    /// <summary>
    /// 自分のプロフィール情報を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<
        Results<Ok<UserResponse>, NotFound>
    > GetProfile()
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

    /// <summary>
    /// 自分のプロフィール情報を更新
    /// </summary>
    /// <param name="request">更新情報</param>
    /// <returns>更新結果</returns>
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<
        Results<Ok, BadRequest<ErrorResponse>, NotFound>
    > UpdateProfile(
        UpdateProfileRequest request
    )
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

        try
        {
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
            _logger.LogError(ex, "プロフィール更新中にエラーが発生しました。UserId: {UserId}", me);
            throw;
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
    public async Task<
        Results<Ok<MessageResponse>, BadRequest<ErrorResponse>, NotFound>
    > UpdateEmail(UpdateEmailRequest request)
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

        // 新しいメールアドレスが既に使用されていないかチェック
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.NewEmail);
        if (existingUser != null)
        {
            return TypedResults.BadRequest(new ErrorResponse
            {
                Message = "このメールアドレスは既に使用されています。"
            });
        }

        // テストメールを同期的に送信
        try
        {
            await _emailService.SendTemplatedEmailAsync(
                request.NewEmail,
                "メールアドレス変更テスト",
                "test-email",
                new { Email = request.NewEmail }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "テストメール送信に失敗しました。UserId: {UserId}, NewEmail: {NewEmail}", me, request.NewEmail);
            return TypedResults.BadRequest(new ErrorResponse
            {
                Message = "新しいメールアドレスにメールが届かないため、変更できませんでした。メールアドレスを確認してください。"
            });
        }

        // DB更新
        user.Email = request.NewEmail;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = me;
        await _context.SaveChangesAsync();

        _logger.LogInformation("メールアドレスを変更しました。UserId: {UserId}, NewEmail: {NewEmail}", me, request.NewEmail);

        return TypedResults.Ok(new MessageResponse { Message = "メールアドレスを変更しました。" });
    }
}