using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.Kimi;

// RemoveAllResilienceHandlers は実験的APIだが、ServiceDefaults のデフォルトタイムアウト(30秒)を
// 上書きするために必要。AI APIは応答に60-120秒かかることがある。
#pragma warning disable EXTEXP0001

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
        // 注意: ServiceDefaults の ConfigureHttpClientDefaults で設定されるデフォルトの
        // ResilienceHandler (30秒タイムアウト) を無効化し、AI用の長いタイムアウトを適用
        services.AddHttpClient(KimiClient.HttpClientName, (sp, client) =>
        {
            client.Timeout = timeout;
        })
        .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip
        })
        // デフォルトの ResilienceHandler を削除し、AI用の設定で上書き
        .RemoveAllResilienceHandlers()
        // LLM API は応答に時間がかかるため、Resilience Handler のタイムアウトをカスタマイズ
        .AddStandardResilienceHandler(options =>
        {
            // 各リクエスト試行のタイムアウト（デフォルト: 10秒 → カスタム設定）
            options.AttemptTimeout.Timeout = timeout;
            // リクエスト全体のタイムアウト（デフォルト: 30秒 → カスタム設定の2倍）
            options.TotalRequestTimeout.Timeout = timeout * 2;
            // サーキットブレーカーのサンプリング期間も延長
            options.CircuitBreaker.SamplingDuration = timeout * 2;
        });

        return services;
    }
}
