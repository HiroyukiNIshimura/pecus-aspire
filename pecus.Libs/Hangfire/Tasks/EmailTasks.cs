using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pecus.Libs.Mail.Models;
using Pecus.Libs.Mail.Services;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// 【注意】このクラスは汎用的なメール送信専用です。
/// 業務固有のメール送信処理（例：デバイス通知、パスワードリセット等）は
/// サービス層や専用クラスで実装してください。
/// EmailTasksへの追加は禁止です。
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
    /// 単純なメールを送信
    /// </summary>
    /// <param name="to">宛先メールアドレス</param>
    /// <param name="subject">件名</param>
    /// <param name="htmlBody">HTML本文</param>
    /// <param name="textBody">テキスト本文</param>
    public async Task SendSimpleEmailAsync(
        string to,
        string subject,
        string? htmlBody = null,
        string? textBody = null
    )
    {
        _logger.LogInformation("Sending simple email to {To}", to);

        var message = new EmailMessage
        {
            To = new List<string> { to },
            Subject = subject,
            HtmlBody = htmlBody,
            TextBody = textBody,
        };

        await _emailService.SendAsync(message);

        _logger.LogInformation("Simple email sent to {To}", to);
    }

    /// <summary>
    /// テンプレートを使用してメールを送信
    /// </summary>
    /// <typeparam name="TModel">テンプレートにバインドするモデルの型</typeparam>
    /// <param name="to">宛先メールアドレス</param>
    /// <param name="subject">件名</param>
    /// <param name="templateName">テンプレート名（拡張子なし）</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    public async Task SendTemplatedEmailAsync<TModel>(
        string to,
        string subject,
        string templateName,
        TModel model
    )
    {
        _logger.LogInformation(
            "Sending templated email to {To} using template {Template}",
            to,
            templateName
        );

        await _emailService.SendTemplatedEmailAsync(to, subject, templateName, model);

        _logger.LogInformation("Templated email sent to {To}", to);
    }

    /// <summary>
    /// カスタマイズ可能なテンプレートメールを送信（複数宛先、添付ファイル、カスタムヘッダーなど）
    /// </summary>
    /// <typeparam name="TModel">テンプレートにバインドするモデルの型</typeparam>
    /// <param name="message">メールメッセージ（宛先、件名、添付ファイル、カスタムヘッダーなど）</param>
    /// <param name="templateName">テンプレート名（拡張子なし）</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    public async Task SendCustomTemplatedEmailAsync<TModel>(
        EmailMessage message,
        string templateName,
        TModel model
    )
    {
        _logger.LogInformation(
            "Sending custom templated email to {Recipients} using template {Template}",
            string.Join(", ", message.To),
            templateName
        );

        await _emailService.SendTemplatedEmailAsync(message, templateName, model);

        _logger.LogInformation(
            "Custom templated email sent to {Recipients}",
            string.Join(", ", message.To)
        );
    }

    /// <summary>
    /// 複数の宛先に同じメールを一括送信
    /// </summary>
    /// <typeparam name="TModel">テンプレートにバインドするモデルの型</typeparam>
    /// <param name="recipients">宛先メールアドレスのリスト</param>
    /// <param name="subject">件名</param>
    /// <param name="templateName">テンプレート名（拡張子なし）</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    public async Task SendBulkTemplatedEmailAsync<TModel>(
        List<string> recipients,
        string subject,
        string templateName,
        TModel model
    )
    {
        _logger.LogInformation(
            "Sending bulk templated email to {Count} recipients using template {Template}",
            recipients.Count,
            templateName
        );

        var tasks = recipients.Select(recipient =>
            _emailService.SendTemplatedEmailAsync(recipient, subject, templateName, model)
        );

        await Task.WhenAll(tasks);

        _logger.LogInformation("Bulk templated email sent to {Count} recipients", recipients.Count);
    }

    /// <summary>
    /// 各宛先に異なるモデルを使用して一括送信
    /// </summary>
    /// <typeparam name="TModel">テンプレートにバインドするモデルの型</typeparam>
    /// <param name="emailData">宛先とモデルのペアのリスト</param>
    /// <param name="subject">件名</param>
    /// <param name="templateName">テンプレート名（拡張子なし）</param>
    public async Task SendPersonalizedBulkEmailAsync<TModel>(
        List<(string To, TModel Model)> emailData,
        string subject,
        string templateName
    )
    {
        _logger.LogInformation(
            "Sending personalized bulk email to {Count} recipients using template {Template}",
            emailData.Count,
            templateName
        );

        var tasks = emailData.Select(data =>
            _emailService.SendTemplatedEmailAsync(data.To, subject, templateName, data.Model)
        );

        await Task.WhenAll(tasks);

        _logger.LogInformation(
            "Personalized bulk email sent to {Count} recipients",
            emailData.Count
        );
    }

}
