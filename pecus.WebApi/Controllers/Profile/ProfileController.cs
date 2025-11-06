using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
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
    private readonly ILogger<ProfileController> _logger;
    private readonly ProfileService _profileService;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ProfileController(
        UserService userService,
        ILogger<ProfileController> logger,
        ProfileService profileService
    )
    {
        _userService = userService;
        _logger = logger;
        _profileService = profileService;
    }

    /// <summary>
    /// 自分のプロフィール情報を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<UserResponse>> GetProfile()
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        var user = await _userService.GetUserByIdAsync(me);
        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
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
            RowVersion = user.RowVersion!,
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
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok> UpdateProfile(UpdateProfileRequest request)
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // バリデーション: AvatarType="user-avatar"の場合、AvatarUrlが必須
        if (request.AvatarType == "user-avatar" && string.IsNullOrWhiteSpace(request.AvatarUrl))
        {
            throw new InvalidOperationException(
                "AvatarType が 'user-avatar' の場合、AvatarUrl は必須です。"
            );
        }

        var updatedUser = await _userService.UpdateProfileAsync(me, request, me);
        if (updatedUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        _logger.LogInformation("ユーザープロフィールを更新しました。UserId: {UserId}", me);
        return TypedResults.Ok();
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
    public async Task<Ok<MessageResponse>> UpdateEmail(UpdateEmailRequest request)
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // 新しいメールアドレスが現在のものと同じかチェック
        var user = await _userService.GetUserByIdAsync(me);
        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        if (user.Email.Equals(request.NewEmail, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "新しいメールアドレスは現在のメールアドレスと異なっている必要があります。"
            );
        }

        // 新しいメールアドレスが既に使用されていないかチェックとDB更新
        var updateResult = await _profileService.UpdateEmailAsync(me, request.NewEmail);
        if (!updateResult)
        {
            throw new DuplicateException("このメールアドレスは既に使用されています。");
        }

        _logger.LogInformation(
            "メールアドレスを変更しました。UserId: {UserId}, NewEmail: {NewEmail}",
            me,
            request.NewEmail
        );

        return TypedResults.Ok(new MessageResponse { Message = "メールアドレスを変更しました。" });
    }
}