using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models;

/// <summary>
/// チャットメッセージ
/// </summary>
public class ChatMessage
{
    /// <summary>
    /// メッセージの役割（system, developer, user, assistant）
    /// </summary>
    [JsonPropertyName("role")]
    public required string Role { get; set; }

    /// <summary>
    /// メッセージの内容
    /// 拒否（refusal）時は null になるため省略可能とする
    /// </summary>
    [JsonPropertyName("content")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Content { get; set; }

    /// <summary>
    /// 拒否メッセージ（モデルが安全上の理由で回答を拒否した場合に設定される）
    /// </summary>
    [JsonPropertyName("refusal")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Refusal { get; set; }

    /// <summary>
    /// システムメッセージを作成（レガシー互換用、DeepSeek等で使用）
    /// </summary>
    public static ChatMessage System(string content) => new() { Role = "system", Content = content };

    /// <summary>
    /// 開発者メッセージを作成（OpenAI GPT-4o以降推奨）
    /// </summary>
    public static ChatMessage Developer(string content) => new() { Role = "developer", Content = content };

    /// <summary>
    /// ユーザーメッセージを作成
    /// </summary>
    public static ChatMessage User(string content) => new() { Role = "user", Content = content };

    /// <summary>
    /// アシスタントメッセージを作成
    /// </summary>
    public static ChatMessage Assistant(string content) => new() { Role = "assistant", Content = content };
}