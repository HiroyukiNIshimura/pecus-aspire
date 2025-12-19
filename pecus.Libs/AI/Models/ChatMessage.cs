using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Models;

/// <summary>
/// チャットメッセージ
/// </summary>
public class ChatMessage
{
    /// <summary>
    /// メッセージの役割（system, user, assistant）
    /// </summary>
    [JsonPropertyName("role")]
    public required string Role { get; set; }

    /// <summary>
    /// メッセージの内容
    /// </summary>
    [JsonPropertyName("content")]
    public required string Content { get; set; }

    /// <summary>
    /// システムメッセージを作成
    /// </summary>
    public static ChatMessage System(string content) => new() { Role = "system", Content = content };

    /// <summary>
    /// ユーザーメッセージを作成
    /// </summary>
    public static ChatMessage User(string content) => new() { Role = "user", Content = content };

    /// <summary>
    /// アシスタントメッセージを作成
    /// </summary>
    public static ChatMessage Assistant(string content) => new() { Role = "assistant", Content = content };
}
