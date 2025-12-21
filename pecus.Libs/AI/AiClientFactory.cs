using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.DeepSeek;
using Pecus.Libs.AI.Provider.Default;
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
    private readonly IOptions<GeminiSettings> _geminiSettings;
    private readonly IOptions<DeepSeekSettings> _deepSeekSettings;
    private readonly ILoggerFactory _loggerFactory;
    private readonly DefaultAiClient _defaultClient;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public AiClientFactory(
        IHttpClientFactory httpClientFactory,
        IOptions<OpenAISettings> openAiSettings,
        IOptions<GeminiSettings> geminiSettings,
        IOptions<DeepSeekSettings> deepSeekSettings,
        ILoggerFactory loggerFactory,
        DefaultAiClient defaultClient)
    {
        _httpClientFactory = httpClientFactory;
        _openAiSettings = openAiSettings;
        _geminiSettings = geminiSettings;
        _deepSeekSettings = deepSeekSettings;
        _loggerFactory = loggerFactory;
        _defaultClient = defaultClient;
    }

    /// <inheritdoc />
    public IAiClient GetDefaultClient() => _defaultClient;

    /// <inheritdoc />
    public IAiClient? CreateClient(GenerativeApiVendor vendor, string? apiKey, string? model = null)
    {
        if (string.IsNullOrEmpty(apiKey) || vendor == GenerativeApiVendor.None)
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