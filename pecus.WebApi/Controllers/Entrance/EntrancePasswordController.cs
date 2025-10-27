using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// パスワード設定コントローラー（公開エンドポイント）
/// </summary>
[ApiController]
[Route("api/entrance/password")]
[Produces("application/json")]
[AllowAnonymous]
public class EntrancePasswordController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ILogger<EntrancePasswordController> _logger;

    public EntrancePasswordController(
        UserService userService,
        ILogger<EntrancePasswordController> logger
    )
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// パスワードを設定
    /// </summary>
    /// <remarks>
    /// メールで送信されたトークンを使ってパスワードを設定します。
    /// トークンは24時間有効です。
    /// </remarks>
    /// <param name="request">パスワード設定リクエスト</param>
    /// <response code="200">パスワードが設定されました</response>
    /// <response code="400">トークンが無効または期限切れです</response>
    [HttpPost("set")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<SuccessResponse>, BadRequest<ErrorResponse>>> SetPassword(
        [FromBody] SetUserPasswordRequest request
    )
    {
        try
        {
            var result = await _userService.SetUserPasswordAsync(request);
            if (!result)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse { Message = "トークンが無効または期限切れです。" }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse { Message = "パスワードが設定されました。ログインしてください。" }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "パスワード設定中にエラーが発生しました");
            throw;
        }
    }
}