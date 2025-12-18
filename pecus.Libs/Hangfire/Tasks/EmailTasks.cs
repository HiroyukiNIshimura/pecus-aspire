using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pecus.Libs.Mail.Models;
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

    /// <summary>
    /// EmailTasks のコンストラクタ
    /// </summary>
    /// <param name="emailService">メール送信サービス</param>
    /// <param name="logger">ロガー</param>
    /// <param name="config">設定</param>
    public EmailTasks(IEmailService emailService, ILogger<EmailTasks> logger, IConfiguration config)
    {
        _emailService = emailService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// 型安全なテンプレートメール送信（テンプレート名は型から自動取得）
    /// </summary>
    /// <typeparam name="TModel">IEmailTemplateModel を実装したモデルの型</typeparam>
    /// <param name="to">宛先メールアドレス</param>
    /// <param name="subject">件名</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    public async Task SendTemplatedEmailAsync<TModel>(
        string to,
        string subject,
        TModel model
    )
        where TModel : IEmailTemplateModel<TModel>
    {
        await _emailService.SendTemplatedEmailAsync(to, subject, model);
    }

}