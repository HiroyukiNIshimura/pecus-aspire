using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI.Provider.Anthropic;

/// <summary>
/// Anthropic Claude APIクライアントのインターフェース
/// </summary>
public interface IAnthropicClient
{
    /// <summary>
    /// メッセージ生成を実行
    /// </summary>
    /// <param name="request">リクエスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>レスポンス</returns>
    Task<AnthropicResponse> CreateMessageAsync(
        AnthropicRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// シンプルなテキスト生成
    /// </summary>
    /// <param name="systemPrompt">システムプロンプト</param>
    /// <param name="userPrompt">ユーザープロンプト</param>
    /// <param name="persona">ペルソナ（オプション）。指定時は最初のsystemプロンプトとして送信</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたテキスト</returns>
    Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// タイトルからMarkdown本文を生成
    /// </summary>
    /// <param name="title">タイトル</param>
    /// <param name="additionalContext">追加のコンテキスト情報（オプション）</param>
    /// <param name="persona">ペルソナ（オプション）。指定時は最初のsystemプロンプトとして送信</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたMarkdownテキスト</returns>
    Task<string> GenerateMarkdownFromTitleAsync(
        string title,
        string? additionalContext = null,
        string? persona = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 利用可能なモデル一覧を取得
    /// </summary>
    /// <param name="apiKey">APIキー</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>利用可能なモデルのリスト</returns>
    Task<IReadOnlyList<AvailableModel>> GetAvailableModelsAsync(
        string apiKey,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Anthropic APIリクエスト
/// </summary>
public class AnthropicRequest
{
    /// <summary>
    /// 使用するモデル名
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("model")]
    public required string Model { get; set; }

    /// <summary>
    /// 最大トークン数
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("max_tokens")]
    public int MaxTokens { get; set; } = 2048;

    /// <summary>
    /// システムプロンプト
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("system")]
    [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
    public string? SystemPrompt { get; set; }

    /// <summary>
    /// メッセージ履歴
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("messages")]
    public required List<AnthropicMessage> Messages { get; set; }

    /// <summary>
    /// Temperature（0.0-1.0）
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("temperature")]
    [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
    public double? Temperature { get; set; }
}

/// <summary>
/// Anthropicメッセージ
/// </summary>
public class AnthropicMessage
{
    /// <summary>
    /// メッセージの役割（"user" または "assistant"）
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("role")]
    public required string Role { get; set; }

    /// <summary>
    /// メッセージの内容
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("content")]
    public required string Content { get; set; }

    /// <summary>
    /// ユーザーメッセージを作成
    /// </summary>
    public static AnthropicMessage User(string content) => new() { Role = "user", Content = content };

    /// <summary>
    /// アシスタントメッセージを作成
    /// </summary>
    public static AnthropicMessage Assistant(string content) => new() { Role = "assistant", Content = content };
}

/// <summary>
/// Anthropic APIレスポンス
/// </summary>
public class AnthropicResponse
{
    /// <summary>
    /// レスポンスID
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// オブジェクトタイプ
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 使用されたモデル
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;

    /// <summary>
    /// メッセージの役割
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// コンテンツブロック
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("content")]
    public List<AnthropicContentBlock> Content { get; set; } = [];

    /// <summary>
    /// 停止理由
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("stop_reason")]
    public string? StopReason { get; set; }

    /// <summary>
    /// 使用量情報
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("usage")]
    public AnthropicUsage? Usage { get; set; }
}

/// <summary>
/// Anthropicコンテンツブロック
/// </summary>
public class AnthropicContentBlock
{
    /// <summary>
    /// コンテンツタイプ
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// テキストコンテンツ
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

/// <summary>
/// Anthropic使用量情報
/// </summary>
public class AnthropicUsage
{
    /// <summary>
    /// 入力トークン数
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("input_tokens")]
    public int InputTokens { get; set; }

    /// <summary>
    /// 出力トークン数
    /// </summary>
    [System.Text.Json.Serialization.JsonPropertyName("output_tokens")]
    public int OutputTokens { get; set; }
}
