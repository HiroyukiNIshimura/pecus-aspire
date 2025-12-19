using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.Gemini;

namespace Pecus.Libs.AI.Extensions;

/// <summary>
/// Gemini サービス登録拡張メソッド
/// </summary>
public static class GeminiServiceExtensions
{
    /// <summary>
    /// GeminiクライアントをDIコンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <param name="configuration">設定</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddGeminiClient(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 設定をバインド
        services.Configure<GeminiSettings>(
            configuration.GetSection(GeminiSettings.SectionName));

        // 設定値を取得してバリデーション
        var settings = configuration
            .GetSection(GeminiSettings.SectionName)
            .Get<GeminiSettings>();

        if (settings == null || string.IsNullOrEmpty(settings.ApiKey))
        {
            // APIキーが設定されていない場合はスキップ（オプショナル機能として扱う）
            return services;
        }

        // Named HttpClient を登録
        services.AddHttpClient(GeminiClient.HttpClientName, (sp, client) =>
        {
            client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip
        });

        // GeminiClient を登録（IGeminiClient と IAiClient の両方に対応）
        services.AddScoped<GeminiClient>();
        services.AddScoped<IGeminiClient>(sp => sp.GetRequiredService<GeminiClient>());
        services.AddScoped<IAiClient>(sp => sp.GetRequiredService<GeminiClient>());

        return services;
    }
}
