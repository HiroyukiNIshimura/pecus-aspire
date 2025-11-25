using Serilog;
using Serilog.Events;

namespace Pecus.Libs;

/// <summary>
/// Serilog設定のヘルパークラス
/// </summary>
public static class SerilogHelper
{
    /// <summary>
    /// Serilog Loggerを作成（共通設定）
    /// </summary>
    /// <param name="applicationName">アプリケーション名（ログファイル名とプロパティに使用）</param>
    public static void CreateLogger(string applicationName)
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            //.MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Information)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Query", LogEventLevel.Debug)
            .MinimumLevel.Override("Aspire.Hosting.Dcp", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .Enrich.WithMachineName()
            .Enrich.WithEnvironmentName()
            .Enrich.WithProperty("ApplicationName", applicationName)
            .WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}"
            )
            .WriteTo.File(
                path: $"logs/{applicationName}-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 7,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}"
            )
            .CreateLogger();
    }
}