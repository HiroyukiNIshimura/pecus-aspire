using Microsoft.Extensions.DependencyInjection;
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
}