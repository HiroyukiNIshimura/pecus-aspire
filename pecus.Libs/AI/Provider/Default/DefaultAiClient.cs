using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Models;
using Pecus.Libs.AI.Provider.Anthropic;
using Pecus.Libs.AI.Provider.DeepSeek;
using Pecus.Libs.AI.Provider.Gemini;
using Pecus.Libs.AI.Provider.OpenAI;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.AI.Provider.Default;

/// <summary>
/// システムデフォルトAIクライアント
/// 設定により Anthropic / DeepSeek / Gemini / OpenAI から選択可能
/// </summary>
public class DefaultAiClient : IDefaultAiClient
{
    private readonly IAiClient _innerClient;
    private readonly ILogger<DefaultAiClient> _logger;
    private readonly GenerativeApiVendor _provider;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public DefaultAiClient(
        IHttpClientFactory httpClientFactory,
        IOptions<DefaultAiSettings> defaultAiSettings,
        IOptions<OpenAISettings> openAiSettings,
        IOptions<AnthropicSettings> anthropicSettings,
        IOptions<GeminiSettings> geminiSettings,
        IOptions<DeepSeekSettings> deepSeekSettings,
        ILoggerFactory loggerFactory,
        ILogger<DefaultAiClient> logger)
    {
        _logger = logger;

        var settings = defaultAiSettings.Value;
        _provider = settings.Provider;

        _innerClient = CreateInnerClient(
            settings,
            httpClientFactory,
            openAiSettings,
            anthropicSettings,
            geminiSettings,
            deepSeekSettings,
            loggerFactory);

        _logger.LogInformation(
            "DefaultAiClient initialized with provider: {Provider}, model: {Model}",
            _provider,
            settings.Model ?? "(default)");
    }

    /// <summary>
    /// 設定に基づいて内部クライアントを生成
    /// </summary>
    private static IAiClient CreateInnerClient(
        DefaultAiSettings settings,
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAISettings> openAiSettings,
        IOptions<AnthropicSettings> anthropicSettings,
        IOptions<GeminiSettings> geminiSettings,
        IOptions<DeepSeekSettings> deepSeekSettings,
        ILoggerFactory loggerFactory)
    {
        // APIキーの決定：DefaultAi設定 > 各プロバイダー設定
        var apiKey = settings.ApiKey;

        return settings.Provider switch
        {
            GenerativeApiVendor.OpenAi => CreateOpenAiClient(
                httpClientFactory, openAiSettings, loggerFactory, apiKey, settings.Model),

            GenerativeApiVendor.Anthropic => CreateAnthropicClient(
                httpClientFactory, anthropicSettings, loggerFactory, apiKey, settings.Model),

            GenerativeApiVendor.GoogleGemini => CreateGeminiClient(
                httpClientFactory, geminiSettings, loggerFactory, apiKey, settings.Model),

            GenerativeApiVendor.DeepSeek => CreateDeepSeekClient(
                httpClientFactory, deepSeekSettings, loggerFactory, apiKey, settings.Model),

            GenerativeApiVendor.None => throw new InvalidOperationException(
                "DefaultAi:Provider が設定されていません。appsettings.json で DefaultAi:Provider を設定してください。"),

            _ => throw new InvalidOperationException(
                $"サポートされていないプロバイダー: {settings.Provider}")
        };
    }

    private static OpenAIClient CreateOpenAiClient(
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAISettings> settings,
        ILoggerFactory loggerFactory,
        string? apiKey,
        string? model)
    {
        var effectiveApiKey = apiKey ?? settings.Value.ApiKey;
        if (string.IsNullOrEmpty(effectiveApiKey))
        {
            throw new InvalidOperationException(
                "OpenAI APIキーが設定されていません。DefaultAi:ApiKey または OpenAI:ApiKey を設定してください。");
        }

        return new OpenAIClient(
            httpClientFactory,
            settings,
            loggerFactory.CreateLogger<OpenAIClient>(),
            effectiveApiKey,
            model);
    }

    private static AnthropicClient CreateAnthropicClient(
        IHttpClientFactory httpClientFactory,
        IOptions<AnthropicSettings> settings,
        ILoggerFactory loggerFactory,
        string? apiKey,
        string? model)
    {
        var effectiveApiKey = apiKey ?? settings.Value.ApiKey;
        if (string.IsNullOrEmpty(effectiveApiKey))
        {
            throw new InvalidOperationException(
                "Anthropic APIキーが設定されていません。DefaultAi:ApiKey または Anthropic:ApiKey を設定してください。");
        }

        return new AnthropicClient(
            httpClientFactory,
            settings,
            loggerFactory.CreateLogger<AnthropicClient>(),
            effectiveApiKey,
            model);
    }

    private static GeminiClient CreateGeminiClient(
        IHttpClientFactory httpClientFactory,
        IOptions<GeminiSettings> settings,
        ILoggerFactory loggerFactory,
        string? apiKey,
        string? model)
    {
        var effectiveApiKey = apiKey ?? settings.Value.ApiKey;
        if (string.IsNullOrEmpty(effectiveApiKey))
        {
            throw new InvalidOperationException(
                "Gemini APIキーが設定されていません。DefaultAi:ApiKey または Gemini:ApiKey を設定してください。");
        }

        return new GeminiClient(
            httpClientFactory,
            settings,
            loggerFactory.CreateLogger<GeminiClient>(),
            effectiveApiKey,
            model);
    }

    private static DeepSeekClient CreateDeepSeekClient(
        IHttpClientFactory httpClientFactory,
        IOptions<DeepSeekSettings> settings,
        ILoggerFactory loggerFactory,
        string? apiKey,
        string? model)
    {
        var effectiveApiKey = apiKey ?? settings.Value.ApiKey;
        if (string.IsNullOrEmpty(effectiveApiKey))
        {
            throw new InvalidOperationException(
                "DeepSeek APIキーが設定されていません。DefaultAi:ApiKey または DeepSeek:ApiKey を設定してください。");
        }

        return new DeepSeekClient(
            httpClientFactory,
            settings,
            loggerFactory.CreateLogger<DeepSeekClient>(),
            effectiveApiKey,
            model);
    }

    /// <inheritdoc />
    public Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("DefaultAiClient.GenerateTextAsync using provider: {Provider}", _provider);
        return _innerClient.GenerateTextAsync(systemPrompt, userPrompt, persona, cancellationToken);
    }

    /// <inheritdoc />
    public Task<string> GenerateTextWithMessagesAsync(
        IEnumerable<(MessageRole Role, string Content)> messages,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("DefaultAiClient.GenerateTextWithMessagesAsync using provider: {Provider}", _provider);
        return _innerClient.GenerateTextWithMessagesAsync(messages, persona, cancellationToken);
    }

    /// <inheritdoc />
    public Task<T> GenerateJsonAsync<T>(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default) where T : class
    {
        _logger.LogDebug("DefaultAiClient.GenerateJsonAsync<{Type}> using provider: {Provider}", typeof(T).Name, _provider);
        return _innerClient.GenerateJsonAsync<T>(systemPrompt, userPrompt, persona, cancellationToken);
    }

    /// <inheritdoc />
    public Task<string> GenerateMarkdownFromTitleAsync(
        string title,
        string? additionalContext = null,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("DefaultAiClient.GenerateMarkdownFromTitleAsync using provider: {Provider}", _provider);
        return _innerClient.GenerateMarkdownFromTitleAsync(title, additionalContext, persona, cancellationToken);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AvailableModel>> GetAvailableModelsAsync(
        string apiKey,
        CancellationToken cancellationToken = default)
    {
        // DefaultAiClientではシステム設定のAPIキーを使用するため、
        // 引数のapiKeyは無視して内部クライアントの設定を使用
        _logger.LogDebug("DefaultAiClient.GetAvailableModelsAsync using provider: {Provider}", _provider);
        return _innerClient.GetAvailableModelsAsync(apiKey, cancellationToken);
    }
}
