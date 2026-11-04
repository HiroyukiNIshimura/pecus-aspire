using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Models;
using Pecus.Libs.AI.Provider;
using Pecus.Libs.AI.Schema;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pecus.Libs.AI.Provider.OpenAI;

/// <summary>
/// OpenAI APIクライアント
/// IAiClientを実装し、バックエンド内部でプロバイダー非依存で使用可能
/// </summary>
public class OpenAIClient : IOpenAIClient, IAiClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly OpenAISettings _settings;
    private readonly ILogger<OpenAIClient> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    /// <summary>
    /// HttpClient名
    /// </summary>
    public const string HttpClientName = nameof(OpenAIClient);

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="httpClientFactory">HttpClientファクトリー</param>
    /// <param name="settings">設定</param>
    /// <param name="logger">ロガー</param>
    /// <param name="apiKey">APIキー（必須）</param>
    /// <param name="model">使用するモデル名（必須）</param>
    public OpenAIClient(
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAISettings> settings,
        ILogger<OpenAIClient> logger,
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
    /// 推論モデル（temperature 非対応）かどうかを判定
    /// モデルの追加に追従できるよう、判定パターンは設定値から読み込む
    /// </summary>
    private bool IsReasoningModel(string model)
    {
        return MatchesAnyPattern(model, _settings.ReasoningModelPrefixes,
                   static (value, pattern) => value.StartsWith(pattern, StringComparison.OrdinalIgnoreCase)) ||
               MatchesAnyPattern(model, _settings.ReasoningModelContains,
                   static (value, pattern) => value.Contains(pattern, StringComparison.OrdinalIgnoreCase));
    }

    private static bool MatchesAnyPattern(string model, string? patterns, Func<string, string, bool> match)
    {
        if (string.IsNullOrWhiteSpace(patterns))
        {
            return false;
        }

        return patterns
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(pattern => match(model, pattern));
    }

    /// <summary>
    /// モデルに応じた Temperature を取得（推論モデルの場合は null）
    /// </summary>
    private double? GetTemperatureForModel(string model)
    {
        return IsReasoningModel(model) ? null : _settings.DefaultTemperature;
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
            "OpenAI API request: Model={Model}, Messages={MessageCount}",
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
                "OpenAI API error: Status={StatusCode}, Content={Content}",
                response.StatusCode,
                errorContent);
            response.EnsureSuccessStatusCode();
        }

        var result = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(cancellationToken);

        if (result == null)
        {
            throw new InvalidOperationException("OpenAI API returned null response");
        }

        _logger.LogDebug(
            "OpenAI API response: Id={Id}, TotalTokens={TotalTokens}",
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
            messages.Add(ChatMessage.Developer(persona));
        }

        messages.Add(ChatMessage.Developer(systemPrompt));
        messages.Add(ChatMessage.User(userPrompt));

        var model = GetModel();
        var request = new ChatCompletionRequest
        {
            Model = model,
            Messages = messages,
            Temperature = GetTemperatureForModel(model),
            MaxCompletionTokens = _settings.DefaultMaxTokens
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
            chatMessages.Add(ChatMessage.Developer(persona));
        }

        chatMessages.AddRange(messages.Select(m => new ChatMessage
        {
            Role = m.Role switch
            {
                MessageRole.System => "developer",
                MessageRole.User => "user",
                MessageRole.Assistant => "assistant",
                _ => "user"
            },
            Content = m.Content
        }));

        var model = GetModel();
        var request = new ChatCompletionRequest
        {
            Model = model,
            Messages = chatMessages,
            Temperature = GetTemperatureForModel(model),
            MaxCompletionTokens = _settings.DefaultMaxTokens
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
            requestMessages.Add(ChatMessage.Developer(persona));
        }

        requestMessages.Add(ChatMessage.Developer(jsonSystemPrompt));
        requestMessages.Add(ChatMessage.User(userPrompt));

        var model = GetModel();
        var request = new ChatCompletionRequest
        {
            Model = model,
            Messages = requestMessages,
            Temperature = GetTemperatureForModel(model),
            MaxCompletionTokens = _settings.DefaultMaxTokens,
            ResponseFormat = CreateResponseFormat<T>()
        };

        var response = await ChatCompletionAsync(request, cancellationToken);
        var content = AiJsonResponseGuard.GetContent(response, "OpenAI");

        _logger.LogDebug("OpenAI JSON response content: {Content}", content);

        try
        {
            var result = JsonSerializer.Deserialize<T>(content, AiJsonSerializer.ResponseOptions);

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

    /// <summary>
    /// 構造化出力のレスポンス形式を作成
    /// スキーマを生成できない型や無効化設定の場合は JSON モードへフォールバックする
    /// </summary>
    private ResponseFormat CreateResponseFormat<TResponse>()
    {
        if (_settings.EnableStructuredOutput &&
            AiJsonSchemaBuilder.TryBuild(typeof(TResponse), AiJsonSchemaProfile.OpenAiStrict, out var schema))
        {
            return ResponseFormat.FromSchema(schema);
        }

        return ResponseFormat.Json;
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

        _logger.LogDebug("OpenAI API: Fetching available models");

        var response = await client.GetAsync("models", cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "OpenAI API error fetching models: Status={StatusCode}, Content={Content}",
                response.StatusCode,
                errorContent);
            response.EnsureSuccessStatusCode();
        }

        var result = await response.Content.ReadFromJsonAsync<ModelsListResponse>(cancellationToken);

        if (result?.Data == null)
        {
            _logger.LogWarning("OpenAI API returned null or empty models list");
            return [];
        }

        // GPT系モデルのみをフィルタリング（設定日付以降に作成されたモデル、特殊用途モデルを除外）
        var cutoffDate = DateTimeOffset.Parse(_settings.ModelCreatedAfter).ToUnixTimeSeconds();
        var gptModels = result.Data
            .Where(m => m.Id.StartsWith("gpt-", StringComparison.OrdinalIgnoreCase)
                && m.Created >= cutoffDate
                && !m.Id.Contains("-realtime", StringComparison.OrdinalIgnoreCase)
                && !m.Id.Contains("-image", StringComparison.OrdinalIgnoreCase)
                && !m.Id.Contains("-audio", StringComparison.OrdinalIgnoreCase)
                && !m.Id.Contains("-search", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(m => m.Id)
            .Select(m => new AvailableModel
            {
                Id = m.Id,
                Name = m.Id,
                Description = $"OpenAI {m.Id}"
            })
            .ToList();

        _logger.LogDebug("OpenAI API: Found {Count} GPT models", gptModels.Count);

        return gptModels;
    }
}

/// <summary>
/// OpenAI /models API レスポンス
/// </summary>
internal sealed class ModelsListResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("data")]
    public List<ModelData>? Data { get; set; }
}

/// <summary>
/// モデルデータ
/// </summary>
internal sealed class ModelData
{
    [System.Text.Json.Serialization.JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("owned_by")]
    public string? OwnedBy { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("created")]
    public long Created { get; set; }
}