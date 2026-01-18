using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

namespace Pecus.Libs.Statistics.Extensions;

/// <summary>
/// 統計サービスの DI 登録拡張メソッド
/// </summary>
public static class StatisticsExtensions
{
    /// <summary>
    /// 統計収集サービスを DI コンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddStatistics(this IServiceCollection services)
    {
        services.AddScoped<IStatisticsCollector, StatisticsCollector>();
        services.AddScoped<IHealthDataProvider, HealthDataProvider>();
        return services;
    }
}