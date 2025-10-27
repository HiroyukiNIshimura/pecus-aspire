using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.Mail.Services;
using Pecus.Libs.Mail.Templates.Models;

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

    public TestEmailController(IEmailService emailService, ILogger<TestEmailController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// 利用可能なテンプレート一覧を返す
    /// </summary>
    [HttpGet("templates")]
    public IActionResult ListTemplates()
    {
        var templates = new[] { "welcome", "password-setup", "password-reset", "test-email" };
        return Ok(templates);
    }

    /// <summary>
    /// テスト送信（テンプレート名を指定）
    /// </summary>
    /// <param name="template">テンプレート名（welcome, password-setup, password-reset, test-email）</param>
    [HttpPost("send")]
    public async Task<IActionResult> Send([FromQuery] string? template)
    {
        template ??= "test-email";
        var to = TestEmailConfig.Recipient;

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
                        LoginUrl = "https://example.local/login",
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
                        PasswordSetupUrl = "https://example.local/setup?token=mock-token",
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
                        PasswordResetUrl = "https://example.local/reset?token=mock-token",
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

            return Ok(new { Message = "メール送信要求を実行しました。受信トレイを確認してください。", Recipient = to, Template = template });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "テストメール送信に失敗しました。template={Template}, to={To}", template, to);
            return StatusCode(500, new { Message = "メール送信に失敗しました。ログを確認してください。" });
        }
    }

    /// <summary>
    /// テスト用受信先を設定する
    /// </summary>
    [HttpPost("set-recipient")]
    public IActionResult SetRecipient([FromBody] RecipientRequest req)
    {
        if (string.IsNullOrWhiteSpace(req?.Email)) return BadRequest(new { Message = "Email is required." });
        TestEmailConfig.Recipient = req.Email.Trim();
        return Ok(new { Message = "Recipient updated.", Recipient = TestEmailConfig.Recipient });
    }

    public class RecipientRequest { public string Email { get; set; } = string.Empty; }
}
