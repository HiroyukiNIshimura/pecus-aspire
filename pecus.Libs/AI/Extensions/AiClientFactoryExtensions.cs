using Microsoft.Extensions.DependencyInjection;

namespace Pecus.Libs.AI.Extensions;

/// <summary>
/// AIクライアントファクトリーの登録拡張メソッド
/// </summary>
public static class AiClientFactoryExtensions
{
    /// <summary>
    /// AIクライアントファクトリーをDIコンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddAiClientFactory(this IServiceCollection services)
    {
        services.AddScoped<IAiClientFactory, AiClientFactory>();
        return services;
    }
}