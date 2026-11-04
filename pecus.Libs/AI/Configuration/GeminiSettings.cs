namespace Pecus.Libs.AI.Configuration;

/// <summary>
/// Google Gemini APIに関する設定
/// </summary>
public class GeminiSettings
{
    /// <summary>
    /// 設定セクション名
    /// </summary>
    public const string SectionName = "Gemini";

    /// <summary>
    /// Gemini APIのベースURL
    /// </summary>
    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta";

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
    /// 構造化出力（JSON Schema 強制）を使用するか
    /// スキーマ非対応モデルで 400 になる場合は false に設定する
    /// </summary>
    public bool EnableStructuredOutput { get; set; } = true;
}