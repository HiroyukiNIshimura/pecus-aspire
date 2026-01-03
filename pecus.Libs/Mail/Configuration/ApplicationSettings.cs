namespace Pecus.Libs.Mail.Configuration;

/// <summary>
/// アプリケーション共通設定（メールテンプレート用）
/// </summary>
public class ApplicationSettings
{
    /// <summary>
    /// アプリケーション名
    /// </summary>
    public string Name { get; set; } = "Coati";

    /// <summary>
    /// アプリケーションバージョン
    /// </summary>
    public string Version { get; set; } = "1.0.0";

    /// <summary>
    /// サイトURL
    /// </summary>
    public string SiteUrl { get; set; } = string.Empty;

    /// <summary>
    /// 会社名
    /// </summary>
    public string CompanyName { get; set; } = string.Empty;
}