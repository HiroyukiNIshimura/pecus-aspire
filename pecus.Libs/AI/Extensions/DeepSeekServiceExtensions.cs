using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.DeepSeek;

namespace Pecus.Libs.AI.Extensions;

/// <summary>
/// DeepSeek サービス登録拡張メソッド
/// </summary>
public static class DeepSeekServiceExtensions
{
    /// <summary>
    /// DeepSeekクライアントをDIコンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <param name="configuration">設定</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddDeepSeekClient(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 設定をバインド
        services.Configure<DeepSeekSettings>(
            configuration.GetSection(DeepSeekSettings.SectionName));

        // 設定値を取得してバリデーション
        var settings = configuration
            .GetSection(DeepSeekSettings.SectionName)
            .Get<DeepSeekSettings>();

        if (settings == null || string.IsNullOrEmpty(settings.ApiKey))
        {
            // APIキーが設定されていない場合はスキップ（オプショナル機能として扱う）
            return services;
        }

        // Named HttpClient を登録
        services.AddHttpClient(DeepSeekClient.HttpClientName, (sp, client) =>
        {
            client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip
        });

        // DeepSeekClient を登録（IDeepSeekClient と IAiClient の両方に対応）
        services.AddScoped<DeepSeekClient>();
        services.AddScoped<IDeepSeekClient>(sp => sp.GetRequiredService<DeepSeekClient>());
        services.AddScoped<IAiClient>(sp => sp.GetRequiredService<DeepSeekClient>());

        return services;
    }
}
