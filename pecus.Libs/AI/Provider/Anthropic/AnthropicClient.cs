using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Models;
using System.Net.Http.Json;
using System.Text.Json;

namespace Pecus.Libs.AI.Provider.Anthropic;

/// <summary>
/// Anthropic Claude APIクライアント
/// IAiClientを実装し、バックエンド内部でプロバイダー非依存で使用可能
/// </summary>
public class AnthropicClient : IAnthropicClient, IAiClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AnthropicSettings _settings;
    private readonly ILogger<AnthropicClient> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    /// <summary>
    /// HttpClient名
    /// </summary>
    public const string HttpClientName = nameof(AnthropicClient);

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="httpClientFactory">HttpClientファクトリー</param>
    /// <param name="settings">設定</param>
    /// <param name="logger">ロガー</param>
    /// <param name="apiKey">APIキー（必須）</param>
    /// <param name="model">使用するモデル名（必須）</param>
    public AnthropicClient(
        IHttpClientFactory httpClientFactory,
        IOptions<AnthropicSettings> settings,
        ILogger<AnthropicClient> logger,
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
        client.DefaultRequestHeaders.Add("x-api-key", GetApiKey());
        client.DefaultRequestHeaders.Add("anthropic-version", _settings.ApiVersion);
        return client;
    }

    /// <inheritdoc />
    public async Task<AnthropicResponse> CreateMessageAsync(
        AnthropicRequest request,
        CancellationToken cancellationToken = default)
    {
        using var client = CreateClient();

        _logger.LogDebug(
            "Anthropic API request: Model={Model}, Messages={MessageCount}",
            request.Model,
            request.Messages.Count);

        var response = await client.PostAsJsonAsync(
            "messages",
            request,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Anthropic API error: Status={StatusCode}, Content={Content}",
                response.StatusCode,
                errorContent);
            response.EnsureSuccessStatusCode();
        }

        var result = await response.Content.ReadFromJsonAsync<AnthropicResponse>(cancellationToken);

        if (result == null)
        {
            throw new InvalidOperationException("Anthropic API returned null response");
        }

        _logger.LogDebug(
            "Anthropic API response: Id={Id}, InputTokens={InputTokens}, OutputTokens={OutputTokens}",
            result.Id,
            result.Usage?.InputTokens,
            result.Usage?.OutputTokens);

        return result;
    }

    /// <inheritdoc />
    public async Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        // ペルソナとsystemPromptを結合
        var combinedSystemPrompt = string.IsNullOrEmpty(persona)
            ? systemPrompt
            : $"{persona}\n\n{systemPrompt}";

        var request = new AnthropicRequest
        {
            Model = GetModel(),
            MaxTokens = _settings.DefaultMaxTokens,
            SystemPrompt = combinedSystemPrompt,
            Messages = [AnthropicMessage.User(userPrompt)],
            Temperature = _settings.DefaultTemperature
        };

        var response = await CreateMessageAsync(request, cancellationToken);
        return response.Content.FirstOrDefault(c => c.Type == "text")?.Text ?? string.Empty;
    }

    /// <inheritdoc />
    public async Task<string> GenerateTextWithMessagesAsync(
        IEnumerable<(MessageRole Role, string Content)> messages,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        // AnthropicはsystemメッセージをSystemプロパティとして分離する必要がある
        var messageList = messages.ToList();
        var systemMessages = messageList.Where(m => m.Role == MessageRole.System).ToList();
        var conversationMessages = messageList.Where(m => m.Role != MessageRole.System).ToList();

        // user/assistantメッセージをMessagesに変換
        var anthropicMessages = conversationMessages.Select(m => new AnthropicMessage
        {
            Role = m.Role == MessageRole.Assistant ? "assistant" : "user",
            Content = m.Content
        }).ToList();

        // ペルソナとsystemメッセージを結合
        var systemParts = new List<string>();
        if (!string.IsNullOrEmpty(persona))
        {
            systemParts.Add(persona);
        }
        if (systemMessages.Count > 0)
        {
            systemParts.AddRange(systemMessages.Select(m => m.Content));
        }

        var request = new AnthropicRequest
        {
            Model = GetModel(),
            MaxTokens = _settings.DefaultMaxTokens,
            SystemPrompt = systemParts.Count > 0 ? string.Join("\n\n", systemParts) : null,
            Messages = anthropicMessages,
            Temperature = _settings.DefaultTemperature
        };

        var response = await CreateMessageAsync(request, cancellationToken);
        return response.Content.FirstOrDefault(c => c.Type == "text")?.Text ?? string.Empty;
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

        // ペルソナとjsonSystemPromptを結合
        var combinedSystemPrompt = string.IsNullOrEmpty(persona)
            ? jsonSystemPrompt
            : $"{persona}\n\n{jsonSystemPrompt}";

        var request = new AnthropicRequest
        {
            Model = GetModel(),
            MaxTokens = _settings.DefaultMaxTokens,
            SystemPrompt = combinedSystemPrompt,
            Messages = [AnthropicMessage.User(userPrompt)],
            Temperature = _settings.DefaultTemperature
        };

        var response = await CreateMessageAsync(request, cancellationToken);
        var content = response.Content.FirstOrDefault(c => c.Type == "text")?.Text;

        if (string.IsNullOrEmpty(content))
        {
            throw new InvalidOperationException("Anthropic API returned empty content for JSON request");
        }

        _logger.LogDebug("Anthropic JSON response content: {Content}", content);

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
    public Task<IReadOnlyList<AvailableModel>> GetAvailableModelsAsync(
        string apiKey,
        CancellationToken cancellationToken = default)
    {
        // Anthropic APIには動的なモデル一覧取得エンドポイントがないため、
        // 静的なリストを返す
        _logger.LogDebug("Anthropic API: Returning static models list");

        IReadOnlyList<AvailableModel> models =
        [
            new AvailableModel
            {
                Id = "claude-sonnet-4-20250514",
                Name = "Claude Sonnet 4",
                Description = "Anthropic Claude Sonnet 4 - バランスの取れた高性能モデル"
            },
            new AvailableModel
            {
                Id = "claude-3-5-sonnet-20241022",
                Name = "Claude 3.5 Sonnet",
                Description = "Anthropic Claude 3.5 Sonnet - 高速で高品質なレスポンス"
            },
            new AvailableModel
            {
                Id = "claude-3-5-haiku-20241022",
                Name = "Claude 3.5 Haiku",
                Description = "Anthropic Claude 3.5 Haiku - 最も高速で軽量なモデル"
            },
            new AvailableModel
            {
                Id = "claude-3-opus-20240229",
                Name = "Claude 3 Opus",
                Description = "Anthropic Claude 3 Opus - 最も高性能なモデル"
            }
        ];

        return Task.FromResult(models);
    }
}