using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.Mail.Services;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Models.Responses.Common;

namespace Pecus.Controllers.Dev;

/// <summary>
/// 開発用：メールテンプレートのテスト送信エンドポイント
/// </summary>
[ApiController]
[Route("api/dev/email-test")]
[AllowAnonymous]
public class TestEmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<TestEmailController> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TestEmailController(IEmailService emailService, ILogger<TestEmailController> logger, IHttpContextAccessor httpContextAccessor)
    {
        _emailService = emailService;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// 利用可能なテンプレート一覧を返す
    /// </summary>
    [HttpGet("templates")]
    [ProducesResponseType(typeof(string[]), StatusCodes.Status200OK)]
    public Ok<string[]> ListTemplates()
    {
        var templates = new[] { "welcome", "password-setup", "password-reset", "test-email" };
        return TypedResults.Ok(templates);
    }

    /// <summary>
    /// テスト送信（テンプレート名を指定）
    /// </summary>
    /// <param name="template">テンプレート名（welcome, password-setup, password-reset, test-email）</param>
    [HttpPost("send")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<MessageResponse>, StatusCodeHttpResult>
    > Send([FromQuery] string? template)
    {
        template ??= "test-email";
        var to = TestEmailConfig.Recipient;

        // 動的にBaseUrlを取得
        var request = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = request != null ? $"{request.Scheme}://{request.Host}" : "https://localhost";

        try
        {
            switch (template)
            {
                case "welcome":
                    var welcomeModel = new WelcomeEmailModel
                    {
                        UserName = "Test User",
                        Email = to,
                        OrganizationName = "Pecus Demo Org",
                        WorkspaceName = "Demo Workspace",
                        LoginUrl = $"{baseUrl}/login",
                        CreatedAt = DateTime.UtcNow
                    };
                    await _emailService.SendTemplatedEmailAsync(to, "ようこそ - Pecus", "welcome", welcomeModel);
                    break;

                case "password-setup":
                    var setupModel = new PasswordSetupEmailModel
                    {
                        UserName = "Test User",
                        Email = to,
                        OrganizationName = "Pecus Demo Org",
                        PasswordSetupUrl = $"{baseUrl}/setup?token=mock-token",
                        TokenExpiresAt = DateTime.UtcNow.AddHours(24),
                        CreatedAt = DateTime.UtcNow
                    };
                    await _emailService.SendTemplatedEmailAsync(to, "パスワード設定のお知らせ", "password-setup", setupModel);
                    break;

                case "password-reset":
                    var resetModel = new PasswordResetEmailModel
                    {
                        UserName = "Test User",
                        Email = to,
                        PasswordResetUrl = $"{baseUrl}/reset?token=mock-token",
                        TokenExpiresAt = DateTime.UtcNow.AddHours(1),
                        RequestedAt = DateTime.UtcNow
                    };
                    await _emailService.SendTemplatedEmailAsync(to, "パスワードリセット", "password-reset", resetModel);
                    break;

                case "test-email":
                default:
                    var model = new { Email = to };
                    await _emailService.SendTemplatedEmailAsync(to, "テストメール - Pecus", "test-email", model);
                    break;
            }

            return TypedResults.Ok(new MessageResponse { Message = "メール送信要求を実行しました。受信トレイを確認してください。" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "テストメール送信に失敗しました。template={Template}, to={To}", template, to);
            return TypedResults.StatusCode(500);
        }
    }

    /// <summary>
    /// テスト用受信先を設定する
    /// </summary>
    [HttpPost("set-recipient")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status400BadRequest)]
    public Results<Ok<MessageResponse>, BadRequest<MessageResponse>> SetRecipient([FromBody] RecipientRequest req)
    {
        if (string.IsNullOrWhiteSpace(req?.Email)) return TypedResults.BadRequest(new MessageResponse { Message = "Email is required." });
        TestEmailConfig.Recipient = req.Email.Trim();
        return TypedResults.Ok(new MessageResponse { Message = "Recipient updated." });
    }

    public class RecipientRequest { public string Email { get; set; } = string.Empty; }
}
