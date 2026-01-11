using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Pecus.Libs.Mail.Configuration;
using Pecus.Libs.Mail.Models;
using Pecus.Libs.Mail.Templates;

namespace Pecus.Libs.Mail.Services;

/// <summary>
/// MailKitを使用したメール送信サービス
/// インターフェースで定義したメソッド以外をこのクラスに追加しないこと
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly RazorTemplateService _templateService;
    private readonly RazorNonEncodeTemplateService _nonEncodeTemplateService;
    private readonly ILogger<EmailService> _logger;
    private readonly IHostEnvironment _hostEnvironment;

    /// <summary>
    ///  コンストラクタ
    /// </summary>
    /// <param name="settings"></param>
    /// <param name="templateService"></param>
    /// <param name="nonEncodeRazorTemplateService"></param>
    /// <param name="logger"></param>
    /// <param name="hostEnvironment"></param>
    public EmailService(
        IOptions<EmailSettings> settings,
        RazorTemplateService templateService,
        RazorNonEncodeTemplateService nonEncodeRazorTemplateService,
        ILogger<EmailService> logger,
        IHostEnvironment hostEnvironment
    )
    {
        _settings = settings.Value;
        _templateService = templateService;
        _nonEncodeTemplateService = nonEncodeRazorTemplateService;
        _logger = logger;
        _hostEnvironment = hostEnvironment;
    }

    /// <summary>
    /// メールを送信
    /// </summary>
    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        // 開発環境でSendMailInDevelopment=falseの場合はメール送信をスキップ
        if (_hostEnvironment.IsDevelopment() && !_settings.SendMailInDevelopment)
        {
            var textBodyForLog = message.TextBody ?? "(none)";
            if (textBodyForLog.Length > 500)
            {
                textBodyForLog = textBodyForLog.Substring(0, 500) + "...(truncated)";
            }

            _logger.LogInformation(
                "[Development] Email sending skipped.\n" +
                "  To: {To}\n" +
                "  Cc: {Cc}\n" +
                "  Bcc: {Bcc}\n" +
                "  Subject: {Subject}\n" +
                "  TextBody: {TextBody}",
                string.Join(", ", message.To),
                message.Cc.Count > 0 ? string.Join(", ", message.Cc) : "(none)",
                message.Bcc.Count > 0 ? string.Join(", ", message.Bcc) : "(none)",
                message.Subject,
                textBodyForLog
            );
            return;
        }

        var mimeMessage = CreateMimeMessage(message);

        using var client = new SmtpClient();

        _logger.LogInformation("Connecting to SMTP server {Host}:{Port}", _settings.SmtpHost, _settings.SmtpPort);

        try
        {
            // SMTPサーバーに接続（Auto でポートに応じて適切な SSL/TLS 方式を自動選択）
            await client.ConnectAsync(
                _settings.SmtpHost,
                _settings.SmtpPort,
                SecureSocketOptions.Auto,
                cancellationToken
            );

            // 認証
            if (!string.IsNullOrEmpty(_settings.Username))
            {
                await client.AuthenticateAsync(
                    _settings.Username,
                    _settings.Password,
                    cancellationToken
                );
            }

            // メール送信
            await client.SendAsync(mimeMessage, cancellationToken);

            _logger.LogInformation(
                "Email sent successfully to {Recipients}",
                string.Join(", ", message.To)
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send email to {Recipients}",
                string.Join(", ", message.To)
            );
            throw;
        }
        finally
        {
            await client.DisconnectAsync(true, cancellationToken);
        }
    }

    /// <summary>
    /// 型安全なテンプレートメール送信（簡易版）
    /// </summary>
    public async Task SendTemplatedEmailAsync<TModel>(
        string to,
        string subject,
        TModel model,
        CancellationToken cancellationToken = default
    )
        where TModel : IEmailTemplateModel<TModel>
    {
        var message = new EmailMessage
        {
            To = new List<string> { to },
            Subject = subject,
        };

        await SendTemplatedEmailAsync(message, model, cancellationToken);
    }

    /// <summary>
    /// 型安全なテンプレートメール送信（詳細版）
    /// </summary>
    public async Task SendTemplatedEmailAsync<TModel>(
        EmailMessage message,
        TModel model,
        CancellationToken cancellationToken = default
    )
        where TModel : IEmailTemplateModel<TModel>
    {
        var templateName = TModel.TemplateName;
        // HTML本文をレンダリング
        var htmlTemplatePath = $"{templateName}.html.cshtml";
        try
        {
            message.HtmlBody = await _templateService.RenderTemplateAsync(htmlTemplatePath, model);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "HTML template {Template} not found or failed to render",
                htmlTemplatePath
            );
        }

        // テキスト本文をレンダリング
        var textTemplatePath = $"{templateName}.text.cshtml";
        try
        {
            message.TextBody = await _nonEncodeTemplateService.RenderTemplateAsync(textTemplatePath, model);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Text template {Template} not found or failed to render",
                textTemplatePath
            );
        }

        // HTMLもTextもない場合はエラー
        if (string.IsNullOrEmpty(message.HtmlBody) && string.IsNullOrEmpty(message.TextBody))
        {
            throw new InvalidOperationException(
                $"Neither HTML nor Text template found for {templateName}"
            );
        }

        await SendAsync(message, cancellationToken);
    }

    /// <summary>
    /// EmailMessageからMimeMessageを作成
    /// </summary>
    private MimeMessage CreateMimeMessage(EmailMessage message)
    {
        var mimeMessage = new MimeMessage();

        // 送信元
        var fromEmail = message.FromEmail ?? _settings.FromEmail;
        var fromName = message.FromName ?? _settings.FromName;
        mimeMessage.From.Add(new MailboxAddress(fromName, fromEmail));

        // 宛先
        foreach (var to in message.To)
        {
            mimeMessage.To.Add(MailboxAddress.Parse(to));
        }

        // CC
        foreach (var cc in message.Cc)
        {
            mimeMessage.Cc.Add(MailboxAddress.Parse(cc));
        }

        // BCC
        foreach (var bcc in message.Bcc)
        {
            mimeMessage.Bcc.Add(MailboxAddress.Parse(bcc));
        }

        // 返信先
        if (!string.IsNullOrEmpty(message.ReplyTo))
        {
            mimeMessage.ReplyTo.Add(MailboxAddress.Parse(message.ReplyTo));
        }

        // 件名
        mimeMessage.Subject = message.Subject;

        // 優先度
        mimeMessage.Priority = message.Priority switch
        {
            1 => MessagePriority.Urgent,
            5 => MessagePriority.NonUrgent,
            _ => MessagePriority.Normal,
        };

        // カスタムヘッダー
        foreach (var header in message.CustomHeaders)
        {
            mimeMessage.Headers.Add(header.Key, header.Value);
        }

        // 本文と添付ファイル
        var builder = new BodyBuilder();

        if (!string.IsNullOrEmpty(message.HtmlBody))
        {
            builder.HtmlBody = message.HtmlBody;
        }

        if (!string.IsNullOrEmpty(message.TextBody))
        {
            builder.TextBody = message.TextBody;
        }

        // 添付ファイル
        foreach (var attachment in message.Attachments)
        {
            builder.Attachments.Add(
                attachment.FileName,
                attachment.Content,
                ContentType.Parse(attachment.ContentType)
            );
        }

        mimeMessage.Body = builder.ToMessageBody();

        return mimeMessage;
    }
}