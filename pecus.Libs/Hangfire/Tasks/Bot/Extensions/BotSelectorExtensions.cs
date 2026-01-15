using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.Hangfire.Tasks.Bot.Guards;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Extensions;

/// <summary>
/// BotSelectorの登録拡張メソッド
/// </summary>
public static class BotSelectorExtensions
{
    /// <summary>
    /// BotSelectorをDIコンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddBotSelector(this IServiceCollection services)
    {
        services.AddScoped<IBotSelector, BotSelector>();
        return services;
    }

    /// <summary>
    /// BotTaskGuardをDIコンテナに登録
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddBotTaskGuard(this IServiceCollection services)
    {
        services.AddScoped<IBotTaskGuard, BotTaskGuard>();
        return services;
    }
}