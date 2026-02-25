using Microsoft.Extensions.Logging;
using Pecus.Tools.PackageManager.Models;

namespace Pecus.Tools.PackageManager.Services;

/// <summary>
/// パッケージ依存関係の分析サービス
/// </summary>
public class PackageAnalyzer
{
    private readonly ILogger<PackageAnalyzer> _logger;

    public PackageAnalyzer(ILogger<PackageAnalyzer> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// 依存関係グラフを構築
    /// </summary>
    public DependencyGraph BuildDependencyGraph(OutdatedResult result)
    {
        var graph = new DependencyGraph();

        foreach (var project in result.Projects)
        {
            _logger.LogDebug("Processing project: {ProjectName}", project.Name);

            foreach (var targetFramework in project.TargetFrameworks)
            {
                foreach (var dependency in targetFramework.Dependencies)
                {
                    graph.AddNode(
                        dependency.Name,
                        dependency.ResolvedVersion,
                        dependency.LatestVersion,
                        dependency.UpgradeSeverity
                    );
                    graph.AddProjectReference(project.Name, dependency.Name);
                }
            }
        }

        _logger.LogInformation("Built dependency graph with {NodeCount} packages", graph.Nodes.Count);
        return graph;
    }

    /// <summary>
    /// 安全にアップデート可能なパッケージを特定
    /// </summary>
    public List<UpdateRecommendation> GetSafeUpdates(DependencyGraph graph)
    {
        var recommendations = new List<UpdateRecommendation>();

        foreach (var node in graph.Nodes.Values)
        {
            if (node.LatestVersion == node.CurrentVersion)
                continue;

            var severity = CalculateUpdateSeverity(node.CurrentVersion, node.LatestVersion, node.UpgradeSeverity);

            // Patch レベルのみ自動推奨
            if (severity == UpdateSeverity.Patch)
            {
                recommendations.Add(new UpdateRecommendation
                {
                    PackageName = node.Name,
                    CurrentVersion = node.CurrentVersion,
                    TargetVersion = node.LatestVersion,
                    Severity = severity,
                    AffectedProjects = graph.GetAffectedProjects(node.Name).ToList()
                });
            }
        }

        _logger.LogInformation("Found {Count} safe updates (patch level)", recommendations.Count);
        return recommendations;
    }

    /// <summary>
    /// すべての更新可能なパッケージを取得
    /// </summary>
    public List<UpdateRecommendation> GetAllUpdates(DependencyGraph graph)
    {
        var recommendations = new List<UpdateRecommendation>();

        foreach (var node in graph.Nodes.Values)
        {
            if (node.LatestVersion == node.CurrentVersion)
                continue;

            var severity = CalculateUpdateSeverity(node.CurrentVersion, node.LatestVersion, node.UpgradeSeverity);

            recommendations.Add(new UpdateRecommendation
            {
                PackageName = node.Name,
                CurrentVersion = node.CurrentVersion,
                TargetVersion = node.LatestVersion,
                Severity = severity,
                AffectedProjects = graph.GetAffectedProjects(node.Name).ToList()
            });
        }

        return recommendations.OrderByDescending(r => r.Severity).ToList();
    }

    /// <summary>
    /// バージョン間の更新重要度を計算
    /// </summary>
    private UpdateSeverity CalculateUpdateSeverity(string current, string latest, string upgradeSeverity)
    {
        var parsedSeverity = ParseUpgradeSeverity(upgradeSeverity);
        if (parsedSeverity != UpdateSeverity.Unknown)
        {
            return parsedSeverity;
        }

        if (!Version.TryParse(current, out var currentVer) ||
            !Version.TryParse(latest, out var latestVer))
        {
            return UpdateSeverity.Unknown;
        }

        if (currentVer.Major != latestVer.Major)
            return UpdateSeverity.Major;
        if (currentVer.Minor != latestVer.Minor)
            return UpdateSeverity.Minor;
        if (currentVer.Build != latestVer.Build)
            return UpdateSeverity.Patch;

        return UpdateSeverity.None;
    }

    private static UpdateSeverity ParseUpgradeSeverity(string upgradeSeverity)
    {
        if (string.IsNullOrWhiteSpace(upgradeSeverity))
            return UpdateSeverity.Unknown;

        return upgradeSeverity.Trim().ToLowerInvariant() switch
        {
            "major" => UpdateSeverity.Major,
            "minor" => UpdateSeverity.Minor,
            "patch" => UpdateSeverity.Patch,
            "none" => UpdateSeverity.None,
            _ => UpdateSeverity.Unknown
        };
    }
}
