using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Provider.Default;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.AI.Extensions;

/// <summary>
/// Default AIクライアント サービス登録拡張メソッド
/// </summary>
public static class DefaultAiServiceExtensions
{
    /// <summary>
    /// DefaultAiClientをDIコンテナに登録
    /// 設定により Anthropic / DeepSeek / Gemini / OpenAI から選択可能
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <param name="configuration">設定</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddDefaultAiClient(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // DefaultAi設定をバインド
        services.Configure<DefaultAiSettings>(
            configuration.GetSection(DefaultAiSettings.SectionName));

        // 各プロバイダーの設定もバインド（既に登録されている場合は上書きされる）
        services.Configure<OpenAISettings>(
            configuration.GetSection(OpenAISettings.SectionName));
        services.Configure<AnthropicSettings>(
            configuration.GetSection(AnthropicSettings.SectionName));
        services.Configure<GeminiSettings>(
            configuration.GetSection(GeminiSettings.SectionName));
        services.Configure<DeepSeekSettings>(
            configuration.GetSection(DeepSeekSettings.SectionName));
        services.Configure<KimiSettings>(
            configuration.GetSection(KimiSettings.SectionName));

        // 設定値を取得してバリデーション
        var defaultAiSettings = configuration
            .GetSection(DefaultAiSettings.SectionName)
            .Get<DefaultAiSettings>();

        if (defaultAiSettings == null ||
            defaultAiSettings.Provider == GenerativeApiVendor.None ||
            string.IsNullOrEmpty(defaultAiSettings.ApiKey) ||
            string.IsNullOrEmpty(defaultAiSettings.Model))
        {
            // 必須設定が揃っていない場合はスキップ（オプショナル機能として扱う）
            return services;
        }

        // タイムアウト設定は選択されたプロバイダーの設定から取得
        var timeout = GetTimeoutForProvider(defaultAiSettings.Provider, configuration);

        // Named HttpClient を登録（各プロバイダー用）
        RegisterProviderHttpClients(services, timeout);

        // DefaultAiClient を登録
        services.AddScoped<DefaultAiClient>();
        services.AddScoped<IDefaultAiClient>(sp => sp.GetRequiredService<DefaultAiClient>());

        return services;
    }

    /// <summary>
    /// 選択されたプロバイダーのタイムアウト設定を取得
    /// </summary>
    private static TimeSpan GetTimeoutForProvider(
        GenerativeApiVendor provider,
        IConfiguration configuration)
    {
        var timeoutSeconds = provider switch
        {
            GenerativeApiVendor.OpenAi => configuration
                .GetSection(OpenAISettings.SectionName)
                .Get<OpenAISettings>()?.TimeoutSeconds ?? 60,
            GenerativeApiVendor.Anthropic => configuration
                .GetSection(AnthropicSettings.SectionName)
                .Get<AnthropicSettings>()?.TimeoutSeconds ?? 60,
            GenerativeApiVendor.GoogleGemini => configuration
                .GetSection(GeminiSettings.SectionName)
                .Get<GeminiSettings>()?.TimeoutSeconds ?? 60,
            GenerativeApiVendor.DeepSeek => configuration
                .GetSection(DeepSeekSettings.SectionName)
                .Get<DeepSeekSettings>()?.TimeoutSeconds ?? 60,
            GenerativeApiVendor.Kimi => configuration
                .GetSection(KimiSettings.SectionName)
                .Get<KimiSettings>()?.TimeoutSeconds ?? 120,
            _ => 60
        };

        return TimeSpan.FromSeconds(timeoutSeconds);
    }

    /// <summary>
    /// 各プロバイダー用のHttpClientを登録
    /// </summary>
    private static void RegisterProviderHttpClients(
        IServiceCollection services,
        TimeSpan timeout)
    {
        // 各プロバイダーのHttpClient名を登録
        var clientNames = new[]
        {
            Provider.OpenAI.OpenAIClient.HttpClientName,
            Provider.Anthropic.AnthropicClient.HttpClientName,
            Provider.Gemini.GeminiClient.HttpClientName,
            Provider.DeepSeek.DeepSeekClient.HttpClientName,
            Provider.Kimi.KimiClient.HttpClientName
        };

        foreach (var clientName in clientNames)
        {
            services.AddHttpClient(clientName, (sp, client) =>
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
        }
    }
}