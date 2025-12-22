namespace Pecus.Libs.AI.Configuration;

/// <summary>
/// Anthropic Claude APIに関する設定
/// </summary>
public class AnthropicSettings
{
    /// <summary>
    /// 設定セクション名
    /// </summary>
    public const string SectionName = "Anthropic";

    /// <summary>
    /// Anthropic APIのベースURL
    /// </summary>
    public string BaseUrl { get; set; } = "https://api.anthropic.com/v1";

    /// <summary>
    /// APIバージョン（Anthropic-Version ヘッダー用）
    /// </summary>
    public string ApiVersion { get; set; } = "2023-06-01";

    /// <summary>
    /// リクエストタイムアウト（秒）
    /// </summary>
    public int TimeoutSeconds { get; set; } = 60;

    /// <summary>
    /// デフォルトの最大トークン数
    /// </summary>
    public int DefaultMaxTokens { get; set; } = 2048;

    /// <summary>
    /// デフォルトのTemperature（0.0-1.0）
    /// </summary>
    public double DefaultTemperature { get; set; } = 0.7;
}
