namespace Pecus.Libs.AI.Configuration;

/// <summary>
/// DeepSeek APIに関する設定
/// </summary>
public class DeepSeekSettings
{
    /// <summary>
    /// 設定セクション名
    /// </summary>
    public const string SectionName = "DeepSeek";

    /// <summary>
    /// DeepSeek APIキー
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// DeepSeek APIのベースURL
    /// </summary>
    public string BaseUrl { get; set; } = "https://api.deepseek.com";

    /// <summary>
    /// デフォルトのモデル名
    /// </summary>
    public string DefaultModel { get; set; } = "deepseek-chat";

    /// <summary>
    /// リクエストタイムアウト（秒）
    /// </summary>
    public int TimeoutSeconds { get; set; } = 60;

    /// <summary>
    /// デフォルトの最大トークン数
    /// </summary>
    public int DefaultMaxTokens { get; set; } = 2048;

    /// <summary>
    /// デフォルトのTemperature（0.0-2.0）
    /// </summary>
    public double DefaultTemperature { get; set; } = 0.7;
}