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

    /// <summary>
    /// 構造化出力（JSON Schema 強制）を使用するか
    /// スキーマ非対応モデルで 400 になる場合は false に設定する
    /// </summary>
    public bool EnableStructuredOutput { get; set; } = true;

    /// <summary>
    /// temperature を送信しない推論モデルの判定（前方一致・カンマ区切り）
    /// 推論モデルは temperature をサポートしないため、一致した場合は送信しない
    /// </summary>
    public string ReasoningModelPrefixes { get; set; } = "o1,o3,gpt-5";

    /// <summary>
    /// temperature を送信しない推論モデルの判定（部分一致・カンマ区切り）
    /// </summary>
    public string ReasoningModelContains { get; set; } = "-o1,-o3";
}