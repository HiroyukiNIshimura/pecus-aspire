using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Pecus.Libs.Mail.Configuration;
using Pecus.Libs.Mail.Models;

namespace Pecus.Libs.Mail.Services;

/// <summary>
/// MailKitを使用したメール送信サービス
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ITemplateService _templateService;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IOptions<EmailSettings> settings,
        ITemplateService templateService,
        ILogger<EmailService> logger
    )
    {
        _settings = settings.Value;
        _templateService = templateService;
        _logger = logger;
    }

    /// <summary>
    /// メールを送信
    /// </summary>
    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        var mimeMessage = CreateMimeMessage(message);

        using var client = new SmtpClient();

        _logger.LogInformation("Connecting to SMTP server {Host}:{Port}", _settings.SmtpHost, _settings.SmtpPort);

        try
        {
            // SMTPサーバーに接続
            await client.ConnectAsync(
                _settings.SmtpHost,
                _settings.SmtpPort,
                _settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None,
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
    /// テンプレートを使用してメールを送信（簡易版）
    /// </summary>
    public async Task SendTemplatedEmailAsync<TModel>(
        string to,
        string subject,
        string templateName,
        TModel model,
        CancellationToken cancellationToken = default
    )
    {
        var message = new EmailMessage
        {
            To = new List<string> { to },
            Subject = subject,
        };

        await SendTemplatedEmailAsync(message, templateName, model, cancellationToken);
    }

    /// <summary>
    /// テンプレートを使用してメールを送信（詳細版）
    /// </summary>
    public async Task SendTemplatedEmailAsync<TModel>(
        EmailMessage message,
        string templateName,
        TModel model,
        CancellationToken cancellationToken = default
    )
    {
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
            message.TextBody = await _templateService.RenderTemplateAsync(textTemplatePath, model);
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
