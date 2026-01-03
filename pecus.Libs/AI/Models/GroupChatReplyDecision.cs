using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models;

/// <summary>
/// グループチャット返信の判定結果
/// </summary>
public class GroupChatReplyDecision
{
    /// <summary>
    /// 誰かが返信すべきか
    /// </summary>
    [JsonPropertyName("shouldAnyoneReply")]
    public bool ShouldAnyoneReply { get; set; }

    /// <summary>
    /// 返信すべきBotのChatActorId（返信不要の場合はnull）
    /// </summary>
    [JsonPropertyName("responderBotActorId")]
    [JsonConverter(typeof(NullableIntFromStringOrNumberConverter))]
    public int? ResponderBotActorId { get; set; }

    /// <summary>
    /// 返信すべきBotの名前
    /// </summary>
    [JsonPropertyName("responderBotName")]
    public string? ResponderBotName { get; set; }

    /// <summary>
    /// 判定の確信度 (0-100)
    /// </summary>
    [JsonPropertyName("confidence")]
    public int Confidence { get; set; }

    /// <summary>
    /// 判定の根拠
    /// </summary>
    [JsonPropertyName("reasoning")]
    public string Reasoning { get; set; } = string.Empty;

    /// <summary>
    /// 返信不要の結果を作成する
    /// </summary>
    /// <param name="reasoning">判定理由</param>
    /// <param name="confidence">確信度</param>
    /// <returns>返信不要の判定結果</returns>
    public static GroupChatReplyDecision NoReply(string reasoning, int confidence = 100)
    {
        return new GroupChatReplyDecision
        {
            ShouldAnyoneReply = false,
            ResponderBotActorId = null,
            ResponderBotName = null,
            Confidence = confidence,
            Reasoning = reasoning,
        };
    }

    /// <summary>
    /// 返信すべきの結果を作成する
    /// </summary>
    /// <param name="botActorId">返信すべきBotのChatActorId</param>
    /// <param name="botName">返信すべきBotの名前</param>
    /// <param name="reasoning">判定理由</param>
    /// <param name="confidence">確信度</param>
    /// <returns>返信すべきの判定結果</returns>
    public static GroupChatReplyDecision Reply(int botActorId, string botName, string reasoning, int confidence = 80)
    {
        return new GroupChatReplyDecision
        {
            ShouldAnyoneReply = true,
            ResponderBotActorId = botActorId,
            ResponderBotName = botName,
            Confidence = confidence,
            Reasoning = reasoning,
        };
    }
}

/// <summary>
/// 文字列または数値をnullable intに変換するコンバーター
/// AIが文字列でIDを返す場合にも対応
/// </summary>
public class NullableIntFromStringOrNumberConverter : JsonConverter<int?>
{
    /// <inheritdoc />
    public override int? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.String => int.TryParse(reader.GetString(), out var id) ? id : null,
            JsonTokenType.Number => reader.GetInt32(),
            JsonTokenType.Null => null,
            _ => null,
        };
    }

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, int? value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
        }
        else
        {
            writer.WriteNumberValue(value.Value);
        }
    }
}
