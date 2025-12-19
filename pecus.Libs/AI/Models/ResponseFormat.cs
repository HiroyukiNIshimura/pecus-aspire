using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models;

/// <summary>
/// レスポンス形式
/// </summary>
public class ResponseFormat
{
    /// <summary>
    /// 形式タイプ: "text" または "json_object"
    /// </summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = "text";

    /// <summary>
    /// JSON形式を指定
    /// </summary>
    public static ResponseFormat Json => new() { Type = "json_object" };

    /// <summary>
    /// テキスト形式を指定（デフォルト）
    /// </summary>
    public static ResponseFormat Text => new() { Type = "text" };
}
