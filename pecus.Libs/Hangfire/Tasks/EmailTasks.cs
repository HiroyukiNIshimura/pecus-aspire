using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.Mail.Services;
using Pecus.Libs.Mail.Templates;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// このクラスはHangfireタスクとしてメール送信を担当する
/// </summary>
public class EmailTasks
{
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailTasks> _logger;
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// EmailTasks のコンストラクタ
    /// </summary>
    /// <param name="emailService">メール送信サービス</param>
    /// <param name="logger">ロガー</param>
    /// <param name="config">設定</param>
    /// <param name="context">DBコンテキスト</param>
    public EmailTasks(
        IEmailService emailService,
        ILogger<EmailTasks> logger,
        IConfiguration config,
        ApplicationDbContext context
    )
    {
        _emailService = emailService;
        _logger = logger;
        _config = config;
        _context = context;
    }

    /// <summary>
    /// 組織向け型安全なテンプレートメール送信（デモ組織の場合は送信をスキップ）
    /// 業務メール（タスク通知、アクティビティ通知等）に使用
    /// </summary>
    /// <typeparam name="TModel">IEmailTemplateModel を実装したモデルの型</typeparam>
    /// <param name="organizationId">組織ID</param>
    /// <param name="to">宛先メールアドレス</param>
    /// <param name="subject">件名</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    public async Task SendTemplatedEmailAsync<TModel>(
        int organizationId,
        string to,
        string subject,
        TModel model
    )
        where TModel : IEmailTemplateModel<TModel>
    {
        var organization = await _context.Organizations
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            _logger.LogWarning("組織が見つかりません。OrganizationId: {OrganizationId}", organizationId);
            return;
        }

        if (organization.IsDemo)
        {
            _logger.LogDebug(
                "デモ組織のためメール送信をスキップしました。OrganizationId: {OrganizationId}, To: {To}",
                organizationId,
                to
            );
            return;
        }

        if (to.EndsWith(".none"))
        {
            _logger.LogDebug(
                "宛先がダミーアドレスのためメール送信をスキップしました。OrganizationId: {OrganizationId}, To: {To}",
                organizationId,
                to
            );
            return;
        }

        await _emailService.SendTemplatedEmailAsync(to, subject, model);
    }
}