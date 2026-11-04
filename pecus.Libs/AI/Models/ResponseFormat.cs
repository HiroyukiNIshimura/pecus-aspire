using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Pecus.Libs.AI.Schema;

namespace Pecus.Libs.AI.Models;

/// <summary>
/// レスポンス形式
/// </summary>
public class ResponseFormat
{
    /// <summary>
    /// 形式タイプ: "text" / "json_object" / "json_schema"
    /// </summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = "text";

    /// <summary>
    /// 構造化出力のスキーマ定義（type が "json_schema" の場合のみ送信）
    /// </summary>
    [JsonPropertyName("json_schema")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ResponseFormatJsonSchema? JsonSchema { get; set; }

    /// <summary>
    /// JSON形式を指定（スキーマ非対応モデル向けのフォールバック）
    /// </summary>
    public static ResponseFormat Json => new() { Type = "json_object" };

    /// <summary>
    /// テキスト形式を指定（デフォルト）
    /// </summary>
    public static ResponseFormat Text => new() { Type = "text" };

    /// <summary>
    /// スキーマを強制する構造化出力を指定
    /// </summary>
    /// <param name="schema">送信する JSON Schema</param>
    /// <returns>Structured Outputs 用のレスポンス形式</returns>
    public static ResponseFormat FromSchema(AiJsonSchema schema) => new()
    {
        Type = "json_schema",
        JsonSchema = new ResponseFormatJsonSchema
        {
            Name = schema.Name,
            Schema = schema.Schema,
            Strict = true
        }
    };
}

/// <summary>
/// 構造化出力のスキーマ定義
/// </summary>
public class ResponseFormatJsonSchema
{
    /// <summary>
    /// スキーマ名（英数字・アンダースコア・ハイフン、64文字以内）
    /// </summary>
    [JsonPropertyName("name")]
    public required string Name { get; set; }

    /// <summary>
    /// スキーマの説明
    /// </summary>
    [JsonPropertyName("description")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; set; }

    /// <summary>
    /// JSON Schema 本体
    /// </summary>
    [JsonPropertyName("schema")]
    public required JsonObject Schema { get; set; }

    /// <summary>
    /// スキーマへの厳格な準拠を強制するか
    /// </summary>
    [JsonPropertyName("strict")]
    public bool Strict { get; set; } = true;
}
