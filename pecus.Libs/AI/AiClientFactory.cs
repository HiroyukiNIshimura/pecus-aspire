using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.DeepSeek;
using Pecus.Libs.AI.Provider.Default;
using Pecus.Libs.AI.Provider.Gemini;
using Pecus.Libs.AI.Provider.OpenAI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.AI;

/// <summary>
/// AIクライアントファクトリー実装
/// </summary>
public class AiClientFactory : IAiClientFactory
{
    private readonly IServiceProvider _serviceProvider;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="serviceProvider">DIサービスプロバイダー</param>
    public AiClientFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    /// <inheritdoc />
    public IAiClient GetDefaultClient()
    {
        var client = _serviceProvider.GetService<DefaultAiClient>();
        if (client == null)
        {
            throw new InvalidOperationException(
                "Default AI provider is not configured. Check API key settings.");
        }

        return client;
    }

    /// <inheritdoc />
    public async Task<IAiClient?> GetClientForOrganizationAsync(int organizationId, CancellationToken cancellationToken = default)
    {
        var context = _serviceProvider.GetRequiredService<ApplicationDbContext>();

        var setting = await context.OrganizationSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, cancellationToken);

        // 組織設定が見つからない、またはベンダーがNone、またはAPIキーが未設定の場合はnull
        if (setting == null ||
            setting.GenerativeApiVendor == GenerativeApiVendor.None ||
            string.IsNullOrEmpty(setting.GenerativeApiKey))
        {
            return null;
        }

        // 組織設定のAPIキーを使用してクライアントを生成
        return CreateClientWithApiKey(setting.GenerativeApiVendor, setting.GenerativeApiKey);
    }

    /// <summary>
    /// 指定されたAPIキーを使用してクライアントを生成
    /// </summary>
    private IAiClient? CreateClientWithApiKey(GenerativeApiVendor vendor, string apiKey)
    {
        var httpClientFactory = _serviceProvider.GetRequiredService<IHttpClientFactory>();

        return vendor switch
        {
            GenerativeApiVendor.OpenAi => new OpenAIClient(
                httpClientFactory,
                _serviceProvider.GetRequiredService<IOptions<OpenAISettings>>(),
                _serviceProvider.GetRequiredService<ILogger<OpenAIClient>>(),
                apiKey),

            GenerativeApiVendor.GoogleGemini => new GeminiClient(
                httpClientFactory,
                _serviceProvider.GetRequiredService<IOptions<GeminiSettings>>(),
                _serviceProvider.GetRequiredService<ILogger<GeminiClient>>(),
                apiKey),

            GenerativeApiVendor.DeepSeek => new DeepSeekClient(
                httpClientFactory,
                _serviceProvider.GetRequiredService<IOptions<DeepSeekSettings>>(),
                _serviceProvider.GetRequiredService<ILogger<DeepSeekClient>>(),
                apiKey),

            _ => null
        };
    }
}
