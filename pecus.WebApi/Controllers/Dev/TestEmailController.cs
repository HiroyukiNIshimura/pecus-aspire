using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.Mail.Services;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;

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
    private readonly FrontendUrlResolver _frontendUrlResolver;
    private readonly ILogger<TestEmailController> _logger;

    public TestEmailController(
        IEmailService emailService,
        FrontendUrlResolver frontendUrlResolver,
        ILogger<TestEmailController> logger
    )
    {
        _emailService = emailService;
        _frontendUrlResolver = frontendUrlResolver;
        _logger = logger;
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
    public async Task<Ok<MessageResponse>> Send([FromQuery] string? template)
    {
        template ??= "test-email";
        var to = TestEmailConfig.Recipient;

        // デフォルトのフロントエンドURLを取得（開発用なのでOriginヘッダー検証なし）
        var baseUrl = _frontendUrlResolver.GetDefaultFrontendUrl();

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
                await _emailService.SendTemplatedEmailAsync(to, "ようこそ - Pecus", welcomeModel);
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
                await _emailService.SendTemplatedEmailAsync(to, "パスワード設定のお知らせ", setupModel);
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
                await _emailService.SendTemplatedEmailAsync(to, "パスワードリセット", resetModel);
                break;

            case "test-email":
            default:
                var testModel = new TestEmailModel { Email = to };
                await _emailService.SendTemplatedEmailAsync(to, "テストメール - Pecus", testModel);
                break;
        }

        return TypedResults.Ok(new MessageResponse { Message = "メール送信要求を実行しました。受信トレイを確認してください。" });
    }

    /// <summary>
    /// テスト用受信先を設定する
    /// </summary>
    [HttpPost("set-recipient")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status400BadRequest)]
    public Ok<MessageResponse> SetRecipient([FromBody] RecipientRequest req)
    {
        if (string.IsNullOrWhiteSpace(req?.Email))
            throw new InvalidOperationException("メールアドレスは必須です。");
        TestEmailConfig.Recipient = req.Email.Trim();
        return TypedResults.Ok(new MessageResponse { Message = "受信者を更新しました。" });
    }

    public class RecipientRequest { public string Email { get; set; } = string.Empty; }
}