using Pecus.Libs.Mail.Models;
using Pecus.Libs.Mail.Templates;

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
    /// 型安全なテンプレートメール送信（テンプレート名は型から自動取得）
    /// </summary>
    /// <typeparam name="TModel">IEmailTemplateModel を実装したモデルの型</typeparam>
    /// <param name="to">宛先メールアドレス</param>
    /// <param name="subject">件名</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    Task SendTemplatedEmailAsync<TModel>(
        string to,
        string subject,
        TModel model,
        CancellationToken cancellationToken = default
    )
        where TModel : IEmailTemplateModel<TModel>;

    /// <summary>
    /// 型安全なテンプレートメール送信（複数宛先、カスタマイズ可能）
    /// </summary>
    /// <typeparam name="TModel">IEmailTemplateModel を実装したモデルの型</typeparam>
    /// <param name="message">基本的なメールメッセージ情報（宛先、件名など）</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    Task SendTemplatedEmailAsync<TModel>(
        EmailMessage message,
        TModel model,
        CancellationToken cancellationToken = default
    )
        where TModel : IEmailTemplateModel<TModel>;
}