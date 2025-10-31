using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Models.Config;
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
    private readonly EmailTasks _emailTasks;
    private readonly PecusConfig _config;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<EntrancePasswordController> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public EntrancePasswordController(
        UserService userService,
        EmailTasks emailTasks,
        PecusConfig config,
        IBackgroundJobClient backgroundJobClient,
        ILogger<EntrancePasswordController> logger,
        IHttpContextAccessor httpContextAccessor
    )
    {
        _userService = userService;
        _emailTasks = emailTasks;
        _config = config;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// /// パスワードを設定
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
                new SuccessResponse
                {
                    Message = "パスワードが設定されました。ログインしてください。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "パスワード設定中にエラーが発生しました");
            throw;
        }
    }

    /// <summary>
    /// パスワードリセットをリクエスト
    /// </summary>
    /// <remarks>
    /// メールアドレスを入力してパスワードリセットをリクエストします。
    /// パスワードリセット用のメールが送信されます。
    /// </remarks>
    /// <param name="request">パスワードリセットリクエスト</param>
    /// <response code="200">パスワードリセットメールが送信されました</response>
    [HttpPost("request-reset")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    public async Task<Ok<SuccessResponse>> RequestPasswordReset(
        [FromBody] RequestPasswordResetRequest request
    )
    {
        try
        {
            var (success, user) = await _userService.RequestPasswordResetAsync(request);
            if (success && user != null)
            {
                // 動的にBaseUrlを取得
                var requestContext = _httpContextAccessor.HttpContext?.Request;
                var baseUrl = requestContext != null ? $"{requestContext.Scheme}://{requestContext.Host}" : "https://localhost";

                // パスワードリセットURLを構築
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
                        user.Email,
                        "パスワードリセット",
                        "password-reset",
                        emailModel
                    )
                );

                _logger.LogInformation(
                    "パスワードリセットメールを送信しました: {Email}",
                    request.Email
                );
            }

            // セキュリティのため、常に成功メッセージを返す
            return TypedResults.Ok(
                new SuccessResponse { Message = "パスワードリセットメールが送信されました。" }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "パスワードリセットリクエスト中にエラーが発生しました");
            throw;
        }
    }

    /// <summary>
    /// パスワードをリセット
    /// </summary>
    /// <remarks>
    /// メールで送信されたトークンを使ってパスワードをリセットします。
    /// トークンは24時間有効です。
    /// </remarks>
    /// <param name="request">パスワードリセットリクエスト</param>
    /// <response code="200">パスワードがリセットされました</response>
    /// <response code="400">トークンが無効または期限切れです</response>
    [HttpPost("reset")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok<SuccessResponse>, BadRequest<ErrorResponse>>> ResetPassword(
        [FromBody] ResetPasswordRequest request
    )
    {
        try
        {
            var result = await _userService.ResetPasswordAsync(request);
            if (!result)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse { Message = "トークンが無効または期限切れです。" }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    Message =
                        "パスワードがリセットされました。新しいパスワードでログインしてください。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "パスワードリセット中にエラーが発生しました");
            throw;
        }
    }
}
