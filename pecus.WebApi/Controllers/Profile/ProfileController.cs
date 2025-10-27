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
    /// <param name="request">更新情報</param>
    /// <returns>更新結果</returns>
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

        try
        {
            var updatedUser = await _userService.UpdateProfileAsync(me, request, me);
            if (updatedUser == null)
            {
                return NotFound();
            }

            _logger.LogInformation("ユーザープロフィールを更新しました。UserId: {UserId}", me);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "プロフィール更新中にエラーが発生しました。UserId: {UserId}", me);
            throw;
        }
    }
}