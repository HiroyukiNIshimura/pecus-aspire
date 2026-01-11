using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;
using Pecus.Libs.Statistics.Extensions;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Extensions;

/// <summary>
/// BotBehavior の DI 登録拡張メソッド
/// </summary>
public static class BotBehaviorExtensions
{
    /// <summary>
    /// BotBehavior 関連サービスを DI コンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddBotBehaviors(this IServiceCollection services)
    {
        services.AddStatistics();
        services.AddScoped<IHealthDataProvider, HealthDataProvider>();
        services.AddSingleton<IPerspectiveRotator, PerspectiveRotator>();

        services.AddScoped<IBotBehavior, SilentBehavior>();
        services.AddScoped<IBotBehavior, NormalReplyBehavior>();
        services.AddScoped<IBotBehavior, WorkspaceHealthBehavior>();
        services.AddScoped<IBotBehavior, OrganizationHealthBehavior>();

        services.AddScoped<IBotBehaviorSelector, BotBehaviorSelector>();

        return services;
    }
}