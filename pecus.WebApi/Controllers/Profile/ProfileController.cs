using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests;
using Pecus.Models.Responses;
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

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ProfileController(
        UserService userService,
        ApplicationDbContext context,
        ILogger<ProfileController> logger
    )
    {
        _userService = userService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 自分のプロフィール情報を取得
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        var user = await _userService.GetUserByIdAsync(me);
        if (user == null)
        {
            return NotFound();
        }

        var response = new UserResponse
        {
            Id = user.Id,
            LoginId = user.LoginId,
            Username = user.Username,
            Email = user.Email,
            AvatarType = user.AvatarType,
            IdentityIconUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// 自分のプロフィール情報を更新
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdateProfile(
        UpdateProfileRequest request
    )
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // バリデーション: AvatarType="user-avatar"の場合、AvatarUrlが必須
        if (request.AvatarType == "user-avatar" && string.IsNullOrWhiteSpace(request.AvatarUrl))
        {
            return BadRequest(new ErrorResponse
            {
                Message = "AvatarType が 'user-avatar' の場合、AvatarUrl は必須です。"
            });
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 基本プロフィール情報の更新
            var updateUserRequest = new UpdateUserRequest
            {
                Username = request.Username,
                AvatarType = request.AvatarType,
                AvatarUrl = request.AvatarUrl
            };

            var updatedUser = await _userService.UpdateUserAsync(me, updateUserRequest, me);
            if (updatedUser == null)
            {
                return NotFound();
            }

            // スキルの更新（指定されている場合のみ）
            if (request.SkillIds != null)
            {
                var skillUpdateSuccess = await _userService.SetUserSkillsAsync(
                    me,
                    request.SkillIds,
                    me
                );

                if (!skillUpdateSuccess)
                {
                    return NotFound();
                }
            }

            await transaction.CommitAsync();

            _logger.LogInformation("ユーザープロフィールを更新しました。UserId: {UserId}", me);
            return Ok();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "プロフィール更新中にエラーが発生しました。UserId: {UserId}", me);
            throw;
        }
    }
}