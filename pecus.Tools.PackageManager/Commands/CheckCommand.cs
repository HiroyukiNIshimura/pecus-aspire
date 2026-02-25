using Microsoft.Extensions.Logging;
using Pecus.Tools.PackageManager.Models;
using Pecus.Tools.PackageManager.Services;
using Spectre.Console;
using System.CommandLine;

namespace Pecus.Tools.PackageManager.Commands;

/// <summary>
/// パッケージチェックコマンド
/// </summary>
public class CheckCommand : Command
{
    public CheckCommand() : base("check", "NuGet パッケージの更新を確認")
    {
        var solutionOption = new Option<FileInfo>(
            name: "--solution",
            description: "ソリューションファイルのパス",
            getDefaultValue: () => new FileInfo("pecus.sln")
        );

        var showAllOption = new Option<bool>(
            name: "--all",
            description: "すべての更新可能なパッケージを表示（デフォルトは Patch レベルのみ）",
            getDefaultValue: () => false
        );

        AddOption(solutionOption);
        AddOption(showAllOption);

        this.SetHandler(ExecuteAsync, solutionOption, showAllOption);
    }

    private async Task ExecuteAsync(FileInfo solutionFile, bool showAll)
    {
        if (!solutionFile.Exists)
        {
            AnsiConsole.MarkupLine($"[red]エラー:[/] ソリューションファイルが見つかりません: {solutionFile.FullName}");
            return;
        }

        try
        {
            await AnsiConsole.Status()
                .StartAsync("パッケージをスキャン中...", async ctx =>
                {
                    var loggerFactory = LoggerFactory.Create(builder =>
                    {
                        builder.SetMinimumLevel(LogLevel.Warning);
                        builder.AddConsole();
                    });

                    var outdatedService = new DotnetOutdatedService(
                        loggerFactory.CreateLogger<DotnetOutdatedService>()
                    );

                    ctx.Status("dotnet-outdated を実行中...");
                    var result = await outdatedService.ScanSolutionAsync(solutionFile.FullName);

                    var analyzer = new PackageAnalyzer(
                        loggerFactory.CreateLogger<PackageAnalyzer>()
                    );

                    ctx.Status("依存関係を解析中...");
                    var graph = analyzer.BuildDependencyGraph(result);

                    var recommendations = showAll
                        ? analyzer.GetAllUpdates(graph)
                        : analyzer.GetSafeUpdates(graph);

                    ctx.Status("結果を表示中...");
                    DisplayResults(recommendations, showAll);
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

    private void DisplayResults(List<UpdateRecommendation> recommendations, bool showAll)
    {
        if (!recommendations.Any())
        {
            AnsiConsole.MarkupLine("[green]✓[/] すべてのパッケージが最新です！");
            return;
        }

        var table = new Table();
        table.Border(TableBorder.Rounded);
        table.Expand();
        table.AddColumn(new TableColumn("パッケージ").LeftAligned());
        table.AddColumn(new TableColumn("現在").Centered());
        table.AddColumn(new TableColumn("最新").Centered());
        table.AddColumn(new TableColumn("重要度").Centered());
        table.AddColumn(new TableColumn("影響プロジェクト").LeftAligned());

        foreach (var rec in recommendations)
        {
            var severityColor = rec.Severity switch
            {
                UpdateSeverity.Patch => "green",
                UpdateSeverity.Minor => "yellow",
                UpdateSeverity.Major => "red",
                _ => "grey"
            };

            var affectedProjectsDisplay = rec.AffectedProjects.Count > 3
                ? string.Join(", ", rec.AffectedProjects.Take(3)) + $" ... (+{rec.AffectedProjects.Count - 3})"
                : string.Join(", ", rec.AffectedProjects);

            var packageName = Truncate(rec.PackageName, 36);
            var affectedProjects = Truncate(affectedProjectsDisplay, 36);

            table.AddRow(
                packageName,
                $"[grey]{rec.CurrentVersion}[/]",
                $"[{severityColor}]{rec.TargetVersion}[/]",
                $"[{severityColor}]{rec.Severity}[/]",
                affectedProjects
            );
        }

        AnsiConsole.Write(table);

        var patchCount = recommendations.Count(r => r.Severity == UpdateSeverity.Patch);
        var minorCount = recommendations.Count(r => r.Severity == UpdateSeverity.Minor);
        var majorCount = recommendations.Count(r => r.Severity == UpdateSeverity.Major);

        AnsiConsole.WriteLine();
        AnsiConsole.MarkupLine($"[yellow]合計:[/] {recommendations.Count} 個のパッケージが更新可能");
        AnsiConsole.MarkupLine($"  [green]Patch:[/] {patchCount}  [yellow]Minor:[/] {minorCount}  [red]Major:[/] {majorCount}");

        if (!showAll && (minorCount > 0 || majorCount > 0))
        {
            AnsiConsole.WriteLine();
            AnsiConsole.MarkupLine("[dim]すべての更新を表示するには --all オプションを使用してください[/]");
        }
    }

    private static string Truncate(string value, int maxLength)
    {
        if (string.IsNullOrEmpty(value) || maxLength <= 0)
            return string.Empty;

        if (value.Length <= maxLength)
            return value;

        if (maxLength <= 1)
            return value.Substring(0, maxLength);

        return value.Substring(0, maxLength - 1) + "…";
    }
}
