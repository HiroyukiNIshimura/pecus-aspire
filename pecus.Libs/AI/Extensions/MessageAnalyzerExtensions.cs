using Microsoft.Extensions.DependencyInjection;

namespace Pecus.Libs.AI.Extensions;

/// <summary>
/// MessageAnalyzerの登録拡張メソッド
/// </summary>
public static class MessageAnalyzerExtensions
{
    /// <summary>
    /// MessageAnalyzerをDIコンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddMessageAnalyzer(this IServiceCollection services)
    {
        services.AddScoped<IMessageAnalyzer, MessageAnalyzer>();
        return services;
    }
}
