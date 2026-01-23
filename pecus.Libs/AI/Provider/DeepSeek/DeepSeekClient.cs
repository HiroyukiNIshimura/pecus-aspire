using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Models;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Provider.DeepSeek;

/// <summary>
/// DeepSeek APIクライアント
/// IAiClientを実装し、バックエンド内部でプロバイダー非依存で使用可能
/// </summary>
public class DeepSeekClient : IDeepSeekClient, IAiClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly DeepSeekSettings _settings;
    private readonly ILogger<DeepSeekClient> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    /// <summary>
    /// HttpClient名
    /// </summary>
    public const string HttpClientName = nameof(DeepSeekClient);

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="httpClientFactory">HttpClientファクトリー</param>
    /// <param name="settings">設定</param>
    /// <param name="logger">ロガー</param>
    /// <param name="apiKey">APIキー（必須）</param>
    /// <param name="model">使用するモデル名（必須）</param>
    public DeepSeekClient(
        IHttpClientFactory httpClientFactory,
        IOptions<DeepSeekSettings> settings,
        ILogger<DeepSeekClient> logger,
        string apiKey,
        string model)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _logger = logger;
        _apiKey = apiKey;
        _model = model;
    }

    /// <summary>
    /// 使用するAPIキーを取得
    /// </summary>
    private string GetApiKey() => _apiKey;

    /// <summary>
    /// 使用するモデルを取得
    /// </summary>
    private string GetModel() => _model;

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
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", GetApiKey());
        return client;
    }

    /// <inheritdoc />
    public async Task<ChatCompletionResponse> ChatCompletionAsync(
        ChatCompletionRequest request,
        CancellationToken cancellationToken = default)
    {
        using var client = CreateClient();

        _logger.LogDebug(
            "DeepSeek API request: Model={Model}, Messages={MessageCount}",
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
                "DeepSeek API error: Status={StatusCode}, Content={Content}",
                response.StatusCode,
                errorContent);
            response.EnsureSuccessStatusCode();
        }

        var result = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(cancellationToken);

        if (result == null)
        {
            throw new InvalidOperationException("DeepSeek API returned null response");
        }

        _logger.LogDebug(
            "DeepSeek API response: Id={Id}, TotalTokens={TotalTokens}",
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
            Model = GetModel(),
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
            Model = GetModel(),
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
        var template = new Prompts.Common.MarkdownFromTitlePromptTemplate();
        var input = new Prompts.Common.MarkdownFromTitleInput(title, additionalContext);

        return await GenerateTextAsync(
            template.BuildSystemPrompt(input),
            template.BuildUserPrompt(input),
            persona,
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<T> GenerateJsonAsync<T>(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default) where T : class
    {
        // システムプロンプトにJSON指示を追加
        var jsonSystemPrompt = Prompts.Common.JsonPromptHelper.AppendJsonInstruction(systemPrompt);

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
            Model = GetModel(),
            Messages = requestMessages,
            Temperature = _settings.DefaultTemperature,
            MaxTokens = _settings.DefaultMaxTokens,
            ResponseFormat = ResponseFormat.Json
        };

        var response = await ChatCompletionAsync(request, cancellationToken);
        var content = response.Choices.FirstOrDefault()?.Message.Content;

        if (string.IsNullOrEmpty(content))
        {
            throw new InvalidOperationException("DeepSeek API returned empty content for JSON request");
        }

        _logger.LogDebug("DeepSeek JSON response content: {Content}", content);

        try
        {
            var result = JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new JsonStringEnumConverter() }
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
        using var client = _httpClientFactory.CreateClient(HttpClientName);
        var baseUrl = _settings.BaseUrl.TrimEnd('/') + "/";
        client.BaseAddress = new Uri(baseUrl);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        _logger.LogDebug("DeepSeek API: Fetching available models");

        var response = await client.GetAsync("models", cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "DeepSeek API error fetching models: Status={StatusCode}, Content={Content}",
                response.StatusCode,
                errorContent);
            response.EnsureSuccessStatusCode();
        }

        var result = await response.Content.ReadFromJsonAsync<DeepSeekModelsListResponse>(cancellationToken);

        if (result?.Data == null)
        {
            _logger.LogWarning("DeepSeek API returned null or empty models list");
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

        _logger.LogDebug("DeepSeek API: Found {Count} models", models.Count);

        return models;
    }
}

/// <summary>
/// DeepSeek /models API レスポンス
/// </summary>
internal sealed class DeepSeekModelsListResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("data")]
    public List<DeepSeekModelData>? Data { get; set; }
}

/// <summary>
/// モデルデータ
/// </summary>
internal sealed class DeepSeekModelData
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("owned_by")]
    public string? OwnedBy { get; set; }
}