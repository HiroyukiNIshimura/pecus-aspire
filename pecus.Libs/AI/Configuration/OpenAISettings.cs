namespace Pecus.Libs.AI.Configuration;

/// <summary>
/// OpenAI APIに関する設定
/// </summary>
public class OpenAISettings
{
    /// <summary>
    /// 設定セクション名
    /// </summary>
    public const string SectionName = "OpenAI";

    /// <summary>
    /// OpenAI APIのベースURL
    /// </summary>
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";

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

    /// <summary>
    /// モデル一覧取得時のフィルタ：この日付以降に作成されたモデルのみ取得（ISO 8601形式: yyyy-MM-dd）
    /// </summary>
    public string ModelCreatedAfter { get; set; } = "2024-01-01";
}