using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.Anthropic;
using Pecus.Libs.AI.Provider.DeepSeek;
using Pecus.Libs.AI.Provider.Gemini;
using Pecus.Libs.AI.Provider.OpenAI;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.AI;

/// <summary>
/// AIクライアントファクトリー実装
/// </summary>
public class AiClientFactory : IAiClientFactory
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IOptions<OpenAISettings> _openAiSettings;
    private readonly IOptions<AnthropicSettings> _anthropicSettings;
    private readonly IOptions<GeminiSettings> _geminiSettings;
    private readonly IOptions<DeepSeekSettings> _deepSeekSettings;
    private readonly IOptions<DefaultAiSettings> _defaultAiSettings;
    private readonly ILoggerFactory _loggerFactory;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public AiClientFactory(
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAISettings> openAiSettings,
        IOptions<AnthropicSettings> anthropicSettings,
        IOptions<GeminiSettings> geminiSettings,
        IOptions<DeepSeekSettings> deepSeekSettings,
        IOptions<DefaultAiSettings> defaultAiSettings,
        ILoggerFactory loggerFactory)
    {
        _httpClientFactory = httpClientFactory;
        _openAiSettings = openAiSettings;
        _anthropicSettings = anthropicSettings;
        _geminiSettings = geminiSettings;
        _deepSeekSettings = deepSeekSettings;
        _defaultAiSettings = defaultAiSettings;
        _loggerFactory = loggerFactory;
    }

    /// <inheritdoc />
    public IAiClient GetDefaultClient()
    {
        var settings = _defaultAiSettings.Value;

        if (settings.Provider == GenerativeApiVendor.None)
        {
            var validProviders = string.Join(", ", Enum.GetValues<GenerativeApiVendor>()
                .Where(v => v != GenerativeApiVendor.None)
                .Select(v => v.ToString()));
            throw new InvalidOperationException(
                $"DefaultAi:Provider が設定されていません。appsettings.json で設定してください。選択可能なプロバイダー: {validProviders}");
        }
        if (string.IsNullOrEmpty(settings.ApiKey))
        {
            throw new InvalidOperationException(
                "DefaultAi:ApiKey が設定されていません。appsettings.json で設定してください。");
        }
        if (string.IsNullOrEmpty(settings.Model))
        {
            throw new InvalidOperationException(
                "DefaultAi:Model が設定されていません。appsettings.json で設定してください。");
        }

        return CreateClient(settings.Provider, settings.ApiKey, settings.Model)
            ?? throw new InvalidOperationException(
                $"サポートされていないプロバイダー: {settings.Provider}");
    }

    /// <inheritdoc />
    public IAiClient? CreateClient(GenerativeApiVendor vendor, string apiKey, string model)
    {
        if (vendor == GenerativeApiVendor.None)
        {
            return null;
        }

        return vendor switch
        {
            GenerativeApiVendor.OpenAi => new OpenAIClient(
                _httpClientFactory,
                _openAiSettings,
                _loggerFactory.CreateLogger<OpenAIClient>(),
                apiKey,
                model),

            GenerativeApiVendor.Anthropic => new AnthropicClient(
                _httpClientFactory,
                _anthropicSettings,
                _loggerFactory.CreateLogger<AnthropicClient>(),
                apiKey,
                model),

            GenerativeApiVendor.GoogleGemini => new GeminiClient(
                _httpClientFactory,
                _geminiSettings,
                _loggerFactory.CreateLogger<GeminiClient>(),
                apiKey,
                model),

            GenerativeApiVendor.DeepSeek => new DeepSeekClient(
                _httpClientFactory,
                _deepSeekSettings,
                _loggerFactory.CreateLogger<DeepSeekClient>(),
                apiKey,
                model),

            _ => null
        };
    }
}