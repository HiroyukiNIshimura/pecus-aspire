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
    /// DeepSeek用の設定とHttpClientをDIコンテナに登録
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

        // 設定値を取得
        var settings = configuration
            .GetSection(DeepSeekSettings.SectionName)
            .Get<DeepSeekSettings>();

        var timeout = TimeSpan.FromSeconds(settings?.TimeoutSeconds ?? 60);

        // Named HttpClient を登録
        services.AddHttpClient(DeepSeekClient.HttpClientName, (sp, client) =>
        {
            client.Timeout = timeout;
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip
        })
        // LLM API は応答に時間がかかるため、Resilience Handler のタイムアウトをカスタマイズ
        .AddStandardResilienceHandler(options =>
        {
            // 各リクエスト試行のタイムアウト（デフォルト: 10秒 → 60秒）
            options.AttemptTimeout.Timeout = timeout;
            // リクエスト全体のタイムアウト（デフォルト: 30秒 → 120秒）
            options.TotalRequestTimeout.Timeout = timeout * 2;
            // サーキットブレーカーのサンプリング期間も延長
            options.CircuitBreaker.SamplingDuration = timeout * 2;
        });

        return services;
    }
}