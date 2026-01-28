using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.Kimi;

namespace Pecus.Libs.AI.Extensions;

/// <summary>
/// Kimi (Moonshot) サービス登録拡張メソッド
/// </summary>
public static class KimiServiceExtensions
{
    /// <summary>
    /// Kimi用の設定とHttpClientをDIコンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <param name="configuration">設定</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddKimiClient(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 設定をバインド
        services.Configure<KimiSettings>(
            configuration.GetSection(KimiSettings.SectionName));

        // 設定値を取得
        var settings = configuration
            .GetSection(KimiSettings.SectionName)
            .Get<KimiSettings>();

        var timeout = TimeSpan.FromSeconds(settings?.TimeoutSeconds ?? 120);

        // Named HttpClient を登録
        services.AddHttpClient(KimiClient.HttpClientName, (sp, client) =>
        {
            client.Timeout = timeout;
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip
        })
        // LLM API は応答に時間がかかるため、Resilience Handler のタイムアウトをカスタマイズ
        .AddStandardResilienceHandler(options =>
        {
            // 各リクエスト試行のタイムアウト（デフォルト: 10秒 → 120秒）
            options.AttemptTimeout.Timeout = timeout;
            // リクエスト全体のタイムアウト（デフォルト: 30秒 → 240秒）
            options.TotalRequestTimeout.Timeout = timeout * 2;
            // サーキットブレーカーのサンプリング期間も延長
            options.CircuitBreaker.SamplingDuration = timeout * 2;
        });

        return services;
    }
}
