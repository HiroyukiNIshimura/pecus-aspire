using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Models;
using System.Net.Http.Json;
using System.Text.Json;

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

    /// <summary>
    /// HttpClient名
    /// </summary>
    public const string HttpClientName = nameof(OpenAIClient);

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public OpenAIClient(
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAISettings> settings,
        ILogger<OpenAIClient> logger)
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
        CancellationToken cancellationToken = default)
    {
        var request = new ChatCompletionRequest
        {
            Model = _settings.DefaultModel,
            Messages =
            [
                ChatMessage.System(systemPrompt),
                ChatMessage.User(userPrompt)
            ],
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

        return await GenerateTextAsync(systemPrompt, userPrompt, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<T> GenerateJsonAsync<T>(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default) where T : class
    {
        // システムプロンプトにJSON指示を追加
        var jsonSystemPrompt = $"""
            {systemPrompt}

            必ずJSON形式で回答してください。マークダウンのコードブロック（```json など）は使用しないでください。
            純粋なJSONのみを返してください。
            """;

        var request = new ChatCompletionRequest
        {
            Model = _settings.DefaultModel,
            Messages =
            [
                ChatMessage.System(jsonSystemPrompt),
                ChatMessage.User(userPrompt)
            ],
            Temperature = _settings.DefaultTemperature,
            MaxTokens = _settings.DefaultMaxTokens,
            ResponseFormat = ResponseFormat.Json
        };

        var response = await ChatCompletionAsync(request, cancellationToken);
        var content = response.Choices.FirstOrDefault()?.Message.Content;

        if (string.IsNullOrEmpty(content))
        {
            throw new InvalidOperationException("OpenAI API returned empty content for JSON request");
        }

        _logger.LogDebug("OpenAI JSON response content: {Content}", content);

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
}
