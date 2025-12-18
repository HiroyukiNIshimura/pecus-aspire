namespace Pecus.Libs.Mail.Templates;

/// <summary>
/// メールテンプレートモデルのマーカーインターフェース。
/// テンプレート名とモデル型を型安全に紐付ける。
/// </summary>
/// <typeparam name="TSelf">自身の型（CRTP パターン）</typeparam>
public interface IEmailTemplateModel<TSelf>
    where TSelf : IEmailTemplateModel<TSelf>
{
    /// <summary>
    /// 対応するテンプレート名（拡張子なし）
    /// </summary>
    static abstract string TemplateName { get; }
}
