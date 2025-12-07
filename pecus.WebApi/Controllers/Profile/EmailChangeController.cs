using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;
using Pecus.Services;

namespace Pecus.Controllers.Profile;

/// <summary>
/// メールアドレス変更コントローラー
/// </summary>
/// <remarks>
/// メールアドレス変更のトークンベース検証フローを提供します。
/// <list type="number">
/// <item>ユーザーが新しいメールアドレスとパスワードを入力（POST /api/profile/email/request-change）</item>
/// <item>確認メールを送信（リンクにトークンを含む）</item>
/// <item>ユーザーがリンクをクリック（GET /api/profile/email/verify?token=xxx）</item>
/// <item>トークン検証後、メールアドレスを更新</item>
/// </list>
/// </remarks>
[Route("api/profile/email")]
[Tags("Profile")]
public class EmailChangeController : BaseSecureController
{
    private readonly EmailChangeService _emailChangeService;
    private readonly ApplicationDbContext _context;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly FrontendUrlResolver _frontendUrlResolver;
    private readonly ILogger<EmailChangeController> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public EmailChangeController(
        ILogger<EmailChangeController> logger,
        ProfileService profileService,
        EmailChangeService emailChangeService,
        ApplicationDbContext context,
        IBackgroundJobClient backgroundJobClient,
        FrontendUrlResolver frontendUrlResolver
    )
        : base(profileService, logger)
    {
        _logger = logger;
        _emailChangeService = emailChangeService;
        _context = context;
        _backgroundJobClient = backgroundJobClient;
        _frontendUrlResolver = frontendUrlResolver;
    }

    /// <summary>
    /// メールアドレス変更をリクエスト
    /// </summary>
    /// <remarks>
    /// 新しいメールアドレスとパスワード（本人確認用）を送信します。
    /// 確認メールが送信され、24時間有効なトークンが発行されます。
    /// </remarks>
    /// <param name="request">メールアドレス変更リクエスト</param>
    /// <response code="200">確認メールを送信しました</response>
    /// <response code="400">リクエストが無効です（パスワード不一致、重複メールアドレスなど）</response>
    /// <response code="404">ユーザーが見つかりません</response>
    /// <response code="500">サーバーエラー</response>
    [HttpPost("request-change")]
    [ProducesResponseType(typeof(EmailChangeRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<EmailChangeRequestResponse>> RequestEmailChange(
        [FromBody] RequestEmailChangeRequest request
    )
    {
        var response = await _emailChangeService.RequestEmailChangeAsync(
            userId: CurrentUserId,
            request: request
        );

        // ユーザー情報を取得
        var user = await _context
            .Users.Where(u => u.Id == CurrentUserId && u.IsActive)
            .FirstOrDefaultAsync();

        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // Origin ヘッダーからフロントエンドURLを検証・取得
        var frontendUrl = _frontendUrlResolver.GetValidatedFrontendUrl(HttpContext);
        var confirmationUrl = $"{frontendUrl}/verify-email?token={response.Token}";

        var emailModel = new EmailChangeConfirmationEmailModel
        {
            UserName = user.Username,
            CurrentEmail = user.Email,
            NewEmail = request.NewEmail,
            ConfirmationUrl = confirmationUrl,
            TokenExpiresAt = response.ExpiresAt,
            RequestedAt = DateTime.UtcNow
        };

        _backgroundJobClient.Enqueue<EmailTasks>(x =>
            x.SendTemplatedEmailAsync(
                request.NewEmail, // to
                "【Pecus】メールアドレス変更の確認", // subject
                "email-change-confirmation", // templateName
                emailModel // model
            )
        );

        _logger.LogInformation(
            "メールアドレス変更リクエストを受け付けました。UserId: {UserId}, NewEmail: {NewEmail}",
            CurrentUserId,
            request.NewEmail
        );

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// メールアドレス変更を確認（トークン検証）
    /// </summary>
    /// <remarks>
    /// 確認メールに記載されたトークンを検証し、メールアドレスを変更します。
    /// トークンは24時間有効で、一度のみ使用可能です。
    /// </remarks>
    /// <param name="token">確認トークン（GUIDベース、32文字）</param>
    /// <response code="200">メールアドレスの変更が完了しました</response>
    /// <response code="400">トークンが無効または期限切れです</response>
    /// <response code="404">ユーザーまたはトークンが見つかりません</response>
    /// <response code="500">サーバーエラー</response>
    [HttpGet("verify")]
    [ProducesResponseType(typeof(EmailChangeVerifyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<EmailChangeVerifyResponse>> VerifyEmailChange(
        [FromQuery] string token
    )
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException("トークンが指定されていません。");
        }

        var request = new VerifyEmailChangeRequest { Token = token };

        var response = await _emailChangeService.VerifyEmailChangeAsync(request);

        _logger.LogInformation(
            "メールアドレス変更を完了しました。NewEmail: {NewEmail}, ChangedAt: {ChangedAt}",
            response.NewEmail,
            response.ChangedAt
        );

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 未使用のメールアドレス変更トークン情報を取得
    /// </summary>
    /// <remarks>
    /// ユーザーの有効な（未使用かつ期限内の）メールアドレス変更トークン情報を取得します。
    /// トークン本体は返しませんが、新しいメールアドレスと有効期限を確認できます。
    /// </remarks>
    /// <response code="200">トークン情報を取得しました（存在する場合）</response>
    /// <response code="204">有効なトークンが存在しません</response>
    /// <response code="500">サーバーエラー</response>
    [HttpGet("pending")]
    [ProducesResponseType(typeof(PendingEmailChangeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Results<Ok<PendingEmailChangeResponse>, NoContent>> GetPendingEmailChange()
    {
        var tokenRecord = await _emailChangeService.GetPendingTokenAsync(CurrentUserId);

        if (tokenRecord == null)
        {
            return TypedResults.NoContent();
        }

        var response = new PendingEmailChangeResponse
        {
            NewEmail = tokenRecord.NewEmail,
            ExpiresAt = tokenRecord.ExpiresAt,
            CreatedAt = tokenRecord.CreatedAt,
        };

        return TypedResults.Ok(response);
    }
}

/// <summary>
/// 未使用メールアドレス変更トークン情報レスポンス
/// </summary>
public class PendingEmailChangeResponse
{
    /// <summary>
    /// 変更予定の新しいメールアドレス
    /// </summary>
    public required string NewEmail { get; set; }

    /// <summary>
    /// トークン有効期限（UTC）
    /// </summary>
    public required DateTimeOffset ExpiresAt { get; set; }

    /// <summary>
    /// トークン作成日時（UTC）
    /// </summary>
    public required DateTimeOffset CreatedAt { get; set; }
}