using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Role;
using Pecus.Models.Responses.User;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// 認証コントローラー（公開エンドポイント）
/// </summary>
[ApiController]
[Route("api/entrance/auth")]
[Produces("application/json")]
[AllowAnonymous]
public class EntranceAuthController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ILogger<EntranceAuthController> _logger;

    public EntranceAuthController(UserService userService, ILogger<EntranceAuthController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// ログイン
    /// </summary>
    /// <remarks>
    /// EmailまたはLoginIdとパスワードでログインします
    /// </remarks>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<LoginResponse>, UnauthorizedHttpResult, StatusCodeHttpResult>
    > Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _userService.AuthenticateAsync(request);
            if (user == null)
            {
                return TypedResults.Unauthorized();
            }

            // JWTトークンを生成
            var token = JwtBearerUtil.GenerateToken(user);
            var expiresAt = JwtBearerUtil.GetTokenExpiration();
            var expiresIn = JwtBearerUtil.GetExpiresMinutes() * 60; // 秒に変換

            var response = new LoginResponse
            {
                AccessToken = token,
                TokenType = "Bearer",
                ExpiresAt = expiresAt,
                ExpiresIn = expiresIn,
                UserId = user.Id,
                LoginId = user.LoginId,
                Username = user.Username,
                Email = user.Email,
                AvatarType = user.AvatarType,
                IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                    user.AvatarType,
                    user.Id,
                    user.Username,
                    user.Email,
                    user.AvatarUrl
                ),
                Roles = user
                    .Roles.Select(r => new RoleInfoResponse { Id = r.Id, Name = r.Name })
                    .ToList(),
            };
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ログイン中にエラーが発生しました。LoginIdentifier: {LoginIdentifier}",
                request.LoginIdentifier
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
