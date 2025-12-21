using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Models;
using System.Net.Http.Json;
using System.Text.Json;

namespace Pecus.Libs.AI.Provider.Default;

/// <summary>
/// システムデフォルトAIクライアント
/// 現在はDeepSeek APIを使用（将来的に変更可能）
/// </summary>
public class DefaultAiClient : IDefaultAiClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly DeepSeekSettings _settings;
    private readonly ILogger<DefaultAiClient> _logger;

    /// <summary>
    /// HttpClient名
    /// </summary>
    public const string HttpClientName = nameof(DefaultAiClient);

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public DefaultAiClient(
        IHttpClientFactory httpClientFactory,
        IOptions<DeepSeekSettings> settings,
        ILogger<DefaultAiClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _logger = logger;
    }

    /// <summary>
    /// 設定済みのHttpClientを作成
    /// </summary>
    private HttpClient CreateClient()
    {
        var client = _httpClientFactory.CreateClient(HttpClientName);
        // 末尾スラッシュを確保（HttpClientのBaseAddress結合の仕様対応）
        var baseUrl = _settings.BaseUrl.TrimEnd('/') + "/";
        client.BaseAddress = new Uri(baseUrl);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _settings.ApiKey);
        return client;
    }

    /// <summary>
    /// Chat Completionを実行
    /// </summary>
    public async Task<ChatCompletionResponse> ChatCompletionAsync(
        ChatCompletionRequest request,
        CancellationToken cancellationToken = default)
    {
        using var client = CreateClient();

        _logger.LogDebug(
            "Default AI (DeepSeek) API request: Model={Model}, Messages={MessageCount}",
            request.Model,
            request.Messages.Count);

        var response = await client.PostAsJsonAsync(
            "chat/completions",
            request,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Default AI (DeepSeek) API error: Status={StatusCode}, Content={Content}",
                response.StatusCode,
                errorContent);
            response.EnsureSuccessStatusCode();
        }

        var result = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(cancellationToken);

        if (result == null)
        {
            throw new InvalidOperationException("Default AI (DeepSeek) API returned null response");
        }

        _logger.LogDebug(
            "Default AI (DeepSeek) API response: Id={Id}, TotalTokens={TotalTokens}",
            result.Id,
            result.Usage?.TotalTokens);

        return result;
    }

    /// <inheritdoc />
    public async Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        var messages = new List<ChatMessage>();

        // ペルソナが指定されている場合は最初に追加
        if (!string.IsNullOrEmpty(persona))
        {
            messages.Add(ChatMessage.System(persona));
        }

        messages.Add(ChatMessage.System(systemPrompt));
        messages.Add(ChatMessage.User(userPrompt));

        var request = new ChatCompletionRequest
        {
            Model = _settings.DefaultModel,
            Messages = messages,
            Temperature = _settings.DefaultTemperature,
            MaxTokens = _settings.DefaultMaxTokens
        };

        var response = await ChatCompletionAsync(request, cancellationToken);
        return response.Choices.FirstOrDefault()?.Message.Content ?? string.Empty;
    }

    /// <inheritdoc />
    public async Task<string> GenerateTextWithMessagesAsync(
        IEnumerable<(MessageRole Role, string Content)> messages,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        var chatMessages = new List<ChatMessage>();

        // ペルソナが指定されている場合は最初に追加
        if (!string.IsNullOrEmpty(persona))
        {
            chatMessages.Add(ChatMessage.System(persona));
        }

        chatMessages.AddRange(messages.Select(m => new ChatMessage
        {
            Role = m.Role switch
            {
                MessageRole.System => "system",
                MessageRole.User => "user",
                MessageRole.Assistant => "assistant",
                _ => "user"
            },
            Content = m.Content
        }));

        var request = new ChatCompletionRequest
        {
            Model = _settings.DefaultModel,
            Messages = chatMessages,
            Temperature = _settings.DefaultTemperature,
            MaxTokens = _settings.DefaultMaxTokens
        };

        var response = await ChatCompletionAsync(request, cancellationToken);
        return response.Choices.FirstOrDefault()?.Message.Content ?? string.Empty;
    }

    /// <inheritdoc />
    public async Task<string> GenerateMarkdownFromTitleAsync(
        string title,
        string? additionalContext = null,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        var systemPrompt = """
            あなたはビジネス文書作成のアシスタントです。
            与えられたタイトルと補足情報から、適切な本文テンプレートをMarkdown形式で作成してください。

            ルール:
            - 簡潔で分かりやすい文章を心がける
            - 必要に応じて見出し（##, ###）、箇条書き、表を使用する
            - 最初の行はタイトルの見出し（#）から始めない（タイトルは別途表示されるため）
            - 日本語で記述する
            - 補足情報が提供された場合は、その内容に特化した回答を行う
            - 最適解ではなく、あくまで参考例として提供する
            """;

        var userPrompt = string.IsNullOrEmpty(additionalContext)
            ? $"タイトル: {title}"
            : $"タイトル: {title}\n\n補足情報: {additionalContext}";

        return await GenerateTextAsync(systemPrompt, userPrompt, persona, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<T> GenerateJsonAsync<T>(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default) where T : class
    {
        // システムプロンプトにJSON指示を追加
        var jsonSystemPrompt = $"""
            {systemPrompt}

            必ずJSON形式で回答してください。マークダウンのコードブロック（```json など）は使用しないでください。
            純粋なJSONのみを返してください。
            """;

        var requestMessages = new List<ChatMessage>();

        // ペルソナが指定されている場合は最初に追加
        if (!string.IsNullOrEmpty(persona))
        {
            requestMessages.Add(ChatMessage.System(persona));
        }

        requestMessages.Add(ChatMessage.System(jsonSystemPrompt));
        requestMessages.Add(ChatMessage.User(userPrompt));

        var request = new ChatCompletionRequest
        {
            Model = _settings.DefaultModel,
            Messages = requestMessages,
            Temperature = _settings.DefaultTemperature,
            MaxTokens = _settings.DefaultMaxTokens,
            ResponseFormat = ResponseFormat.Json
        };

        var response = await ChatCompletionAsync(request, cancellationToken);
        var content = response.Choices.FirstOrDefault()?.Message.Content;

        if (string.IsNullOrEmpty(content))
        {
            throw new InvalidOperationException("Default AI (DeepSeek) API returned empty content for JSON request");
        }

        _logger.LogDebug("Default AI (DeepSeek) JSON response content: {Content}", content);

        try
        {
            var result = JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result == null)
            {
                throw new InvalidOperationException($"Failed to deserialize JSON response to {typeof(T).Name}");
            }

            return result;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse JSON response: {Content}", content);
            throw new InvalidOperationException($"Failed to parse JSON response: {ex.Message}", ex);
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AvailableModel>> GetAvailableModelsAsync(
        string apiKey,
        CancellationToken cancellationToken = default)
    {
        // DefaultAiClientではシステム設定のAPIキーを使用するため、
        // 外部から指定されたapiKeyは使用しない
        // システムデフォルトで利用可能なモデルを返す

        using var client = _httpClientFactory.CreateClient(HttpClientName);
        var baseUrl = _settings.BaseUrl.TrimEnd('/') + "/";
        client.BaseAddress = new Uri(baseUrl);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _settings.ApiKey);

        _logger.LogDebug("Default AI (DeepSeek) API: Fetching available models");

        var response = await client.GetAsync("models", cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Default AI (DeepSeek) API error fetching models: Status={StatusCode}, Content={Content}",
                response.StatusCode,
                errorContent);
            response.EnsureSuccessStatusCode();
        }

        var result = await response.Content.ReadFromJsonAsync<DefaultModelsListResponse>(cancellationToken);

        if (result?.Data == null)
        {
            _logger.LogWarning("Default AI (DeepSeek) API returned null or empty models list");
            return [];
        }

        // deepseek系モデルのみをフィルタリング
        var models = result.Data
            .Where(m => m.Id.StartsWith("deepseek-", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(m => m.Id)
            .Select(m => new AvailableModel
            {
                Id = m.Id,
                Name = m.Id,
                Description = $"DeepSeek {m.Id}"
            })
            .ToList();

        _logger.LogDebug("Default AI (DeepSeek) API: Found {Count} models", models.Count);

        return models;
    }
}

/// <summary>
/// /models API レスポンス
/// </summary>
internal sealed class DefaultModelsListResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("data")]
    public List<DefaultModelData>? Data { get; set; }
}

/// <summary>
/// モデルデータ
/// </summary>
internal sealed class DefaultModelData
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("owned_by")]
    public string? OwnedBy { get; set; }
}