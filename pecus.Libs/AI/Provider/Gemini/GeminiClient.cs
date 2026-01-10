using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Models.Gemini;
using System.Net.Http.Json;
using System.Text.Json;

namespace Pecus.Libs.AI.Provider.Gemini;

/// <summary>
/// Google Gemini APIクライアント
/// IAiClientを実装し、バックエンド内部でプロバイダー非依存で使用可能
/// </summary>
public class GeminiClient : IGeminiClient, IAiClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly GeminiSettings _settings;
    private readonly ILogger<GeminiClient> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    /// <summary>
    /// HttpClient名
    /// </summary>
    public const string HttpClientName = nameof(GeminiClient);

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="httpClientFactory">HttpClientファクトリー</param>
    /// <param name="settings">設定</param>
    /// <param name="logger">ロガー</param>
    /// <param name="apiKey">APIキー（必須）</param>
    /// <param name="model">使用するモデル名（必須）</param>
    public GeminiClient(
        IHttpClientFactory httpClientFactory,
        IOptions<GeminiSettings> settings,
        ILogger<GeminiClient> logger,
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
        return client;
    }

    /// <inheritdoc />
    public async Task<GeminiResponse> GenerateContentAsync(
        GeminiRequest request,
        CancellationToken cancellationToken = default)
    {
        using var client = CreateClient();

        _logger.LogDebug(
            "Gemini API request: Model={Model}, Contents={ContentCount}",
            GetModel(),
            request.Contents.Count);

        // Gemini APIはURLにモデル名とAPIキーを含める
        var url = $"models/{GetModel()}:generateContent?key={GetApiKey()}";

        var response = await client.PostAsJsonAsync(
            url,
            request,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Gemini API error: Status={StatusCode}, Content={Content}",
                response.StatusCode,
                errorContent);
            response.EnsureSuccessStatusCode();
        }

        var result = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken);

        if (result == null)
        {
            throw new InvalidOperationException("Gemini API returned null response");
        }

        _logger.LogDebug(
            "Gemini API response: TotalTokens={TotalTokens}",
            result.UsageMetadata?.TotalTokenCount);

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

        var request = new GeminiRequest
        {
            SystemInstruction = new GeminiContent
            {
                Parts = [new GeminiPart { Text = combinedSystemPrompt }]
            },
            Contents =
            [
                new GeminiContent
                {
                    Role = "user",
                    Parts = [new GeminiPart { Text = userPrompt }]
                }
            ],
            GenerationConfig = new GeminiGenerationConfig
            {
                Temperature = _settings.DefaultTemperature,
                MaxOutputTokens = _settings.DefaultMaxTokens
            }
        };

        var response = await GenerateContentAsync(request, cancellationToken);
        return response.Candidates.FirstOrDefault()?.Content?.Parts.FirstOrDefault()?.Text ?? string.Empty;
    }

    /// <inheritdoc />
    public async Task<string> GenerateTextWithMessagesAsync(
        IEnumerable<(MessageRole Role, string Content)> messages,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        // GeminiはsystemメッセージをSystemInstructionとして分離する必要がある
        var messageList = messages.ToList();
        var systemMessages = messageList.Where(m => m.Role == MessageRole.System).ToList();
        var conversationMessages = messageList.Where(m => m.Role != MessageRole.System).ToList();

        // user/assistantメッセージをContentsに変換
        var contents = conversationMessages.Select(m => new GeminiContent
        {
            Role = m.Role == MessageRole.Assistant ? "model" : "user", // Geminiはassistantをmodelと呼ぶ
            Parts = [new GeminiPart { Text = m.Content }]
        }).ToList();

        var request = new GeminiRequest
        {
            Contents = contents,
            GenerationConfig = new GeminiGenerationConfig
            {
                Temperature = _settings.DefaultTemperature,
                MaxOutputTokens = _settings.DefaultMaxTokens
            }
        };

        // ペルソナとsystemメッセージを結合してSystemInstructionに設定
        var systemParts = new List<string>();
        if (!string.IsNullOrEmpty(persona))
        {
            systemParts.Add(persona);
        }
        if (systemMessages.Count > 0)
        {
            systemParts.AddRange(systemMessages.Select(m => m.Content));
        }
        if (systemParts.Count > 0)
        {
            request.SystemInstruction = new GeminiContent
            {
                Parts = [new GeminiPart { Text = string.Join("\n\n", systemParts) }]
            };
        }

        var response = await GenerateContentAsync(request, cancellationToken);
        return response.Candidates.FirstOrDefault()?.Content?.Parts.FirstOrDefault()?.Text ?? string.Empty;
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

        var request = new GeminiRequest
        {
            SystemInstruction = new GeminiContent
            {
                Parts = [new GeminiPart { Text = combinedSystemPrompt }]
            },
            Contents =
            [
                new GeminiContent
                {
                    Role = "user",
                    Parts = [new GeminiPart { Text = userPrompt }]
                }
            ],
            GenerationConfig = new GeminiGenerationConfig
            {
                Temperature = _settings.DefaultTemperature,
                MaxOutputTokens = _settings.DefaultMaxTokens,
                ResponseMimeType = "application/json"
            }
        };

        var response = await GenerateContentAsync(request, cancellationToken);
        var content = response.Candidates.FirstOrDefault()?.Content?.Parts.FirstOrDefault()?.Text;

        if (string.IsNullOrEmpty(content))
        {
            throw new InvalidOperationException("Gemini API returned empty content for JSON request");
        }

        _logger.LogDebug("Gemini JSON response content: {Content}", content);

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
    public async Task<IReadOnlyList<AI.Models.AvailableModel>> GetAvailableModelsAsync(
        string apiKey,
        CancellationToken cancellationToken = default)
    {
        using var client = _httpClientFactory.CreateClient(HttpClientName);
        var baseUrl = _settings.BaseUrl.TrimEnd('/') + "/";
        client.BaseAddress = new Uri(baseUrl);

        _logger.LogDebug("Gemini API: Fetching available models");

        // Gemini APIはURLにAPIキーを含める
        var url = $"models?key={apiKey}";

        var response = await client.GetAsync(url, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError(
                "Gemini API error fetching models: Status={StatusCode}, Content={Content}",
                response.StatusCode,
                errorContent);
            response.EnsureSuccessStatusCode();
        }

        var result = await response.Content.ReadFromJsonAsync<GeminiModelsListResponse>(cancellationToken);

        if (result?.Models == null)
        {
            _logger.LogWarning("Gemini API returned null or empty models list");
            return [];
        }

        // generateContentをサポートするモデルのみをフィルタリング
        var models = result.Models
            .Where(m => m.SupportedGenerationMethods?.Contains("generateContent") == true)
            .OrderByDescending(m => m.Name)
            .Select(m => new AI.Models.AvailableModel
            {
                Id = m.Name.Replace("models/", ""),
                Name = m.DisplayName ?? m.Name,
                Description = m.Description ?? $"Google Gemini {m.DisplayName ?? m.Name}"
            })
            .ToList();

        _logger.LogDebug("Gemini API: Found {Count} models with generateContent support", models.Count);

        return models;
    }
}

/// <summary>
/// Gemini /models API レスポンス
/// </summary>
internal sealed class GeminiModelsListResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("models")]
    public List<GeminiModelData>? Models { get; set; }
}

/// <summary>
/// モデルデータ
/// </summary>
internal sealed class GeminiModelData
{
    [System.Text.Json.Serialization.JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("description")]
    public string? Description { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("supportedGenerationMethods")]
    public List<string>? SupportedGenerationMethods { get; set; }
}