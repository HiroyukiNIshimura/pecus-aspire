using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.Anthropic;
using Pecus.Libs.AI.Provider.DeepSeek;
using Pecus.Libs.AI.Provider.Gemini;
using Pecus.Libs.AI.Provider.Kimi;
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
    private readonly IOptions<KimiSettings> _kimiSettings;
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
        IOptions<KimiSettings> kimiSettings,
        ILoggerFactory loggerFactory)
    {
        _httpClientFactory = httpClientFactory;
        _openAiSettings = openAiSettings;
        _anthropicSettings = anthropicSettings;
        _geminiSettings = geminiSettings;
        _deepSeekSettings = deepSeekSettings;
        _kimiSettings = kimiSettings;
        _loggerFactory = loggerFactory;
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

            GenerativeApiVendor.Kimi => new KimiClient(
                _httpClientFactory,
                _kimiSettings,
                _loggerFactory.CreateLogger<KimiClient>(),
                apiKey,
                model),

            _ => null
        };
    }
}