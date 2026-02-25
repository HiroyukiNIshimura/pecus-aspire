using Microsoft.Extensions.Logging;
using Pecus.Tools.PackageManager.Services;
using Spectre.Console;
using System.CommandLine;

namespace Pecus.Tools.PackageManager.Commands;

/// <summary>
/// パッケージ更新コマンド
/// </summary>
public class UpdateCommand : Command
{
    public UpdateCommand() : base("update", "NuGet パッケージの更新を実行")
    {
        var solutionOption = new Option<FileInfo>(
            name: "--solution",
            description: "ソリューションファイルのパス",
            getDefaultValue: () => new FileInfo("pecus.sln")
        );

        var modeOption = new Option<string>(
            name: "--mode",
            description: "更新モード（auto または prompt）",
            getDefaultValue: () => "auto"
        );

        var includeAutoReferencesOption = new Option<bool>(
            name: "--include-auto-references",
            description: "自動参照パッケージを含める（既定: true）",
            getDefaultValue: () => true
        );

        var includeAllOption = new Option<bool>(
            name: "--all",
            description: "Minor/Major も含めて更新（既定: Patch のみ）",
            getDefaultValue: () => false
        );

        AddOption(solutionOption);
        AddOption(modeOption);
        AddOption(includeAutoReferencesOption);
        AddOption(includeAllOption);

        this.SetHandler(ExecuteAsync, solutionOption, modeOption, includeAutoReferencesOption, includeAllOption);
    }

    private async Task ExecuteAsync(FileInfo solutionFile, string mode, bool includeAutoReferences, bool includeAll)
    {
        if (!solutionFile.Exists)
        {
            AnsiConsole.MarkupLine($"[red]エラー:[/] ソリューションファイルが見つかりません: {solutionFile.FullName}");
            return;
        }

        try
        {
            var loggerFactory = LoggerFactory.Create(builder =>
            {
                builder.SetMinimumLevel(LogLevel.Warning);
                builder.AddConsole();
            });

            var outdatedService = new DotnetOutdatedService(
                loggerFactory.CreateLogger<DotnetOutdatedService>()
            );

            if (string.Equals(mode, "prompt", StringComparison.OrdinalIgnoreCase))
            {
                AnsiConsole.MarkupLine("[yellow]プロンプトモードで更新を開始します。指示に従って選択してください。[/]");
                await outdatedService.RunUpgradeAsync(solutionFile.FullName, mode, includeAutoReferences, includeAll);
                return;
            }

            await AnsiConsole.Status()
                .StartAsync("パッケージを更新中...", async ctx =>
                {
                    ctx.Status("dotnet-outdated を実行中...");
                    var (stdout, stderr) = await outdatedService.RunUpgradeAsync(
                        solutionFile.FullName,
                        mode,
                        includeAutoReferences,
                        includeAll
                    );

                    ctx.Status("結果を表示中...");

                    if (!string.IsNullOrWhiteSpace(stdout))
                    {
                        Console.WriteLine(stdout.TrimEnd());
                    }

                    if (!string.IsNullOrWhiteSpace(stderr))
                    {
                        Console.Error.WriteLine(stderr.TrimEnd());
                    }
                });
        }
        catch (InvalidOperationException ex)
        {
            AnsiConsole.MarkupLine($"[red]エラー:[/] {Markup.Escape(ex.Message)}");
        }
        catch (Exception ex)
        {
            AnsiConsole.MarkupLine($"[red]予期しないエラー:[/] {Markup.Escape(ex.Message)}");
            AnsiConsole.WriteException(ex);
        }
    }
}
