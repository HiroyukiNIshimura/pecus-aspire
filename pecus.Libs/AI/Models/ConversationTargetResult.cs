using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models;

/// <summary>
/// 会話の宛先判定結果
/// </summary>
public class ConversationTargetResult
{
    /// <summary>
    /// 判定されたターゲットのID（ボットIDなど）
    /// 宛先が判定できなかった場合はnull
    /// </summary>
    [JsonConverter(typeof(StringOrNumberToStringConverter))]
    public string? TargetId { get; set; }

    /// <summary>
    /// 判定されたターゲットの名前
    /// </summary>
    public string? TargetName { get; set; }

    /// <summary>
    /// 判定の確信度 (0-100)
    /// </summary>
    public int Confidence { get; set; }

    /// <summary>
    /// 判定の根拠となった要素の説明
    /// </summary>
    public string Reasoning { get; set; } = string.Empty;
}

/// <summary>
/// 文字列または数値をstringに変換するコンバーター
/// AIが数値でIDを返す場合にも対応
/// </summary>
public class StringOrNumberToStringConverter : JsonConverter<string?>
{
    /// <inheritdoc />
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.String => reader.GetString(),
            JsonTokenType.Number => reader.GetInt64().ToString(),
            JsonTokenType.Null => null,
            _ => throw new JsonException($"Unexpected token type: {reader.TokenType}"),
        };
    }

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
        }
        else
        {
            writer.WriteStringValue(value);
        }
    }
}