using Pecus.Libs.Mail.Models;

namespace Pecus.Libs.Mail.Services;

/// <summary>
/// メール送信サービスのインターフェース
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// メールを送信
    /// </summary>
    /// <param name="message">送信するメールメッセージ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);

    /// <summary>
    /// テンプレートを使用してメールを送信
    /// </summary>
    /// <typeparam name="TModel">テンプレートにバインドするモデルの型</typeparam>
    /// <param name="to">宛先メールアドレス</param>
    /// <param name="subject">件名</param>
    /// <param name="templateName">テンプレート名（拡張子なし）</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    Task SendTemplatedEmailAsync<TModel>(
        string to,
        string subject,
        string templateName,
        TModel model,
        CancellationToken cancellationToken = default
    );

    /// <summary>
    /// テンプレートを使用してメールを送信（複数宛先、カスタマイズ可能）
    /// </summary>
    /// <typeparam name="TModel">テンプレートにバインドするモデルの型</typeparam>
    /// <param name="message">基本的なメールメッセージ情報（宛先、件名など）</param>
    /// <param name="templateName">テンプレート名（拡張子なし）</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    Task SendTemplatedEmailAsync<TModel>(
        EmailMessage message,
        string templateName,
        TModel model,
        CancellationToken cancellationToken = default
    );
}
