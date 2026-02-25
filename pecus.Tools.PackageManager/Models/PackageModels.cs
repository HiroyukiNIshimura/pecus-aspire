namespace Pecus.Tools.PackageManager.Models;

/// <summary>
/// dotnet-outdated の出力結果
/// </summary>
public class OutdatedResult
{
    public List<ProjectResult> Projects { get; set; } = new();
}

/// <summary>
/// プロジェクトごとの結果
/// </summary>
public class ProjectResult
{
    public string Name { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public List<TargetFramework> TargetFrameworks { get; set; } = new();
}

/// <summary>
/// ターゲットフレームワーク
/// </summary>
public class TargetFramework
{
    public string Name { get; set; } = string.Empty;
    public List<DependencyInfo> Dependencies { get; set; } = new();
}

/// <summary>
/// 依存関係情報
/// </summary>
public class DependencyInfo
{
    public string Name { get; set; } = string.Empty;
    public string ResolvedVersion { get; set; } = string.Empty;
    public string LatestVersion { get; set; } = string.Empty;
    public string UpgradeSeverity { get; set; } = string.Empty;
}

/// <summary>
/// 依存関係グラフ
/// </summary>
public class DependencyGraph
{
    public Dictionary<string, PackageNode> Nodes { get; } = new();
    private readonly Dictionary<string, HashSet<string>> _projectReferences = new();

    public void AddNode(string name, string currentVersion, string latestVersion, string upgradeSeverity)
    {
        if (!Nodes.ContainsKey(name))
        {
            Nodes[name] = new PackageNode
            {
                Name = name,
                CurrentVersion = currentVersion,
                LatestVersion = latestVersion,
                UpgradeSeverity = upgradeSeverity
            };
        }
    }

    public void AddProjectReference(string projectName, string packageName)
    {
        if (!_projectReferences.ContainsKey(packageName))
            _projectReferences[packageName] = new HashSet<string>();

        _projectReferences[packageName].Add(projectName);
    }

    public IEnumerable<string> GetAffectedProjects(string packageName)
    {
        return _projectReferences.TryGetValue(packageName, out var projects)
            ? projects
            : Enumerable.Empty<string>();
    }
}

/// <summary>
/// パッケージノード
/// </summary>
public class PackageNode
{
    public string Name { get; set; } = string.Empty;
    public string CurrentVersion { get; set; } = string.Empty;
    public string LatestVersion { get; set; } = string.Empty;
    public string UpgradeSeverity { get; set; } = string.Empty;
}

/// <summary>
/// 更新推奨情報
/// </summary>
public class UpdateRecommendation
{
    public string PackageName { get; set; } = string.Empty;
    public string CurrentVersion { get; set; } = string.Empty;
    public string TargetVersion { get; set; } = string.Empty;
    public UpdateSeverity Severity { get; set; }
    public List<string> AffectedProjects { get; set; } = new();
}

/// <summary>
/// 更新の重要度
/// </summary>
public enum UpdateSeverity
{
    None,
    Patch,
    Minor,
    Major,
    Unknown
}
