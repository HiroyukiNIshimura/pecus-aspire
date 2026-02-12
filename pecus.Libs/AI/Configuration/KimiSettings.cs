namespace Pecus.Libs.AI.Configuration;

/// <summary>
/// Kimi (Moonshot) APIに関する設定
/// </summary>
public class KimiSettings
{
    /// <summary>
    /// 設定セクション名
    /// </summary>
    public const string SectionName = "Kimi";

    /// <summary>
    /// Kimi APIのベースURL
    /// </summary>
    public string BaseUrl { get; set; } = "https://api.moonshot.cn/v1";

    /// <summary>
    /// リクエストタイムアウト（秒）
    /// </summary>
    public int TimeoutSeconds { get; set; } = 120;

    /// <summary>
    /// デフォルトの最大トークン数
    /// </summary>
    public int DefaultMaxTokens { get; set; } = 4096;

    /// <summary>
    /// デフォルトのTemperature（0.0-1.0）
    /// </summary>
    public double DefaultTemperature { get; set; } = 0.7;
}