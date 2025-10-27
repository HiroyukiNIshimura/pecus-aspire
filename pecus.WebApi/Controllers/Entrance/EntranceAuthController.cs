using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
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
    private readonly RefreshTokenService _refreshService;
    private readonly TokenBlacklistService _blacklistService;
    private readonly ILogger<EntranceAuthController> _logger;

    public EntranceAuthController(UserService userService, RefreshTokenService refreshService, TokenBlacklistService blacklistService, ILogger<EntranceAuthController> logger)
    {
        _userService = userService;
        _refreshService = refreshService;
        _blacklistService = blacklistService;
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

            // 発行したリフレッシュトークンを作成（rotation 用／保存）
            var refreshToken = await _refreshService.CreateRefreshTokenAsync(user.Id);

            // 発行したアクセストークンの JTI をユーザーのトークン一覧に登録（追跡）
            var jti = JwtBearerUtil.GetJtiFromToken(token);
            if (!string.IsNullOrWhiteSpace(jti))
            {
                await _blacklistService.RegisterUserJtiAsync(user.Id, jti);
            }

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
                RefreshToken = refreshToken.Token,
                RefreshExpiresAt = refreshToken.ExpiresAt,
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
