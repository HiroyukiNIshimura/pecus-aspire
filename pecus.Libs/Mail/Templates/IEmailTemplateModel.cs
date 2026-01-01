using Pecus.Libs.Mail.Configuration;

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

/// <summary>
/// メールテンプレートモデルの基底クラス。
/// App プロパティはテンプレートサービスが自動注入する。
/// </summary>
public abstract class EmailTemplateModelBase
{
    /// <summary>
    /// アプリケーション設定（テンプレートサービスが自動設定）
    /// </summary>
    public AppSettings App { get; set; } = new();
}

/// <summary>
/// テンプレートで使用するアプリケーション設定
/// </summary>
public class AppSettings
{
    /// <summary>
    /// アプリケーション名
    /// </summary>
    public string Name { get; set; } = "Coati";

    /// <summary>
    /// サイトURL
    /// </summary>
    public string SiteUrl { get; set; } = string.Empty;

    /// <summary>
    /// 会社名
    /// </summary>
    public string CompanyName { get; set; } = string.Empty;

    /// <summary>
    /// 現在の年（著作権表示用）
    /// </summary>
    public int Year => DateTime.UtcNow.Year;

    /// <summary>
    /// ApplicationSettings から AppSettings を生成
    /// </summary>
    public static AppSettings FromApplicationSettings(ApplicationSettings settings)
    {
        return new AppSettings
        {
            Name = settings.Name,
            SiteUrl = settings.SiteUrl,
            CompanyName = settings.CompanyName
        };
    }
}