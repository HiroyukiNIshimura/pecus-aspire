using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.AI.Tools;
using Pecus.Libs.AI.Tools.Implementations;

namespace Pecus.Libs.AI.Extensions;

/// <summary>
/// AI Tools の DI 登録拡張メソッド
/// </summary>
public static class AiToolsExtensions
{
    /// <summary>
    /// AI Tools をDIコンテナに登録
    /// MCP的なツールベースアーキテクチャで、各ツールを動的に選択・実行できるようにする
    /// </summary>
    /// <param name="services">サービスコレクション</param>
    /// <returns>サービスコレクション</returns>
    public static IServiceCollection AddAiTools(this IServiceCollection services)
    {
        services.AddScoped<IAiTool, GetUserTasksTool>();
        services.AddScoped<IAiTool, SearchInformationTool>();
        services.AddScoped<IAiToolExecutor, AiToolExecutor>();
        return services;
    }
}
