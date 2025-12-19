using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.OpenAI;

namespace Pecus.Libs.AI.Extensions;

/// <summary>
/// OpenAI サービス登録拡張メソッド
/// </summary>
public static class OpenAIServiceExtensions
{
    /// <summary>
    /// OpenAIクライアントをDIコンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <param name="configuration">設定</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddOpenAIClient(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 設定をバインド
        services.Configure<OpenAISettings>(
            configuration.GetSection(OpenAISettings.SectionName));

        // 設定値を取得してバリデーション
        var settings = configuration
            .GetSection(OpenAISettings.SectionName)
            .Get<OpenAISettings>();

        if (settings == null || string.IsNullOrEmpty(settings.ApiKey))
        {
            // APIキーが設定されていない場合はスキップ（オプショナル機能として扱う）
            return services;
        }

        // Named HttpClient を登録
        services.AddHttpClient(OpenAIClient.HttpClientName, (sp, client) =>
        {
            client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip
        });

        // OpenAIClient を登録（IOpenAIClient と IAiClient の両方に対応）
        services.AddScoped<OpenAIClient>();
        services.AddScoped<IOpenAIClient>(sp => sp.GetRequiredService<OpenAIClient>());
        services.AddScoped<IAiClient>(sp => sp.GetRequiredService<OpenAIClient>());

        return services;
    }
}
