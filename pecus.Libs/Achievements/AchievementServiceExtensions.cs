using Microsoft.Extensions.DependencyInjection;

namespace Pecus.Libs.Achievements;

/// <summary>
/// 実績システムのDI登録用拡張メソッド
/// </summary>
public static class AchievementServiceExtensions
{
    /// <summary>
    /// 実績システムのサービスを登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddAchievementServices(this IServiceCollection services)
    {
        // Evaluator を登録
        services.AddScoped<AchievementEvaluator>();

        // 全Strategyを自動登録（リフレクションで IAchievementStrategy 実装を検出）
        var strategyType = typeof(IAchievementStrategy);
        var assembly = typeof(AchievementServiceExtensions).Assembly;

        var strategyTypes = assembly.GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false } && strategyType.IsAssignableFrom(t));

        foreach (var type in strategyTypes)
        {
            services.AddScoped(strategyType, type);
        }

        return services;
    }
}
