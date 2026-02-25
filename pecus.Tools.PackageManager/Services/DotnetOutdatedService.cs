using Microsoft.Extensions.Logging;
using Pecus.Tools.PackageManager.Models;
using System.Diagnostics;
using System.Text.Json;

namespace Pecus.Tools.PackageManager.Services;

/// <summary>
/// dotnet-outdated ツールのラッパーサービス
/// </summary>
public class DotnetOutdatedService
{
    private readonly ILogger<DotnetOutdatedService> _logger;

    public DotnetOutdatedService(ILogger<DotnetOutdatedService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// パッケージの更新を実行
    /// </summary>
    public async Task<(string Stdout, string Stderr)> RunUpgradeAsync(
        string solutionPath,
        string upgradeMode,
        bool includeAutoReferences,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Upgrading packages: {SolutionPath}", solutionPath);

        if (!await IsDotnetOutdatedInstalledAsync(cancellationToken))
        {
            throw new InvalidOperationException(
                "dotnet-outdated tool is not installed. " +
                "Please install it using: dotnet tool install --global dotnet-outdated-tool"
            );
        }

        var solutionDirectory = Path.GetDirectoryName(solutionPath)
            ?? throw new InvalidOperationException("Failed to determine solution directory.");

        var normalizedMode = upgradeMode.Trim().ToLowerInvariant();
        var upgradeArg = normalizedMode switch
        {
            "auto" => "-u",
            "prompt" => "-u:prompt",
            _ => throw new InvalidOperationException("Invalid upgrade mode. Use 'auto' or 'prompt'.")
        };

        var includeAutoReferencesArg = includeAutoReferences ? " --include-auto-references" : string.Empty;

        var startInfo = new ProcessStartInfo
        {
            FileName = "dotnet",
            Arguments = $"outdated \"{solutionPath}\"{includeAutoReferencesArg} {upgradeArg}",
            RedirectStandardOutput = normalizedMode != "prompt",
            RedirectStandardError = normalizedMode != "prompt",
            UseShellExecute = false,
            CreateNoWindow = normalizedMode != "prompt",
            WorkingDirectory = solutionDirectory
        };

        using var process = new Process { StartInfo = startInfo };
        process.Start();

        var output = string.Empty;
        var error = string.Empty;

        if (normalizedMode != "prompt")
        {
            output = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            error = await process.StandardError.ReadToEndAsync(cancellationToken);
        }

        await process.WaitForExitAsync(cancellationToken);

        if (process.ExitCode != 0)
        {
            _logger.LogError("dotnet-outdated upgrade failed with exit code {ExitCode}: {Error}", process.ExitCode, error);
            throw new InvalidOperationException($"dotnet-outdated failed: {error}");
        }

        return (output, error);
    }

    /// <summary>
    /// ソリューションの古いパッケージをスキャン
    /// </summary>
    public async Task<OutdatedResult> ScanSolutionAsync(string solutionPath, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Scanning solution: {SolutionPath}", solutionPath);

        // dotnet-outdated がインストールされているか確認
        if (!await IsDotnetOutdatedInstalledAsync(cancellationToken))
        {
            throw new InvalidOperationException(
                "dotnet-outdated tool is not installed. " +
                "Please install it using: dotnet tool install --global dotnet-outdated-tool"
            );
        }

        var solutionDirectory = Path.GetDirectoryName(solutionPath)
            ?? throw new InvalidOperationException("Failed to determine solution directory.");
        var outputFilePath = Path.Combine(solutionDirectory, "dotnet-outdated.json");

        try
        {
            if (File.Exists(outputFilePath))
            {
                File.Delete(outputFilePath);
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = $"outdated \"{solutionPath}\" --include-auto-references --output-format json --output \"{outputFilePath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = solutionDirectory
            };

            using var process = new Process { StartInfo = startInfo };
            process.Start();

            // 進捗メッセージを読み捨てる
            _ = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            var error = await process.StandardError.ReadToEndAsync(cancellationToken);

            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0)
            {
                _logger.LogError("dotnet-outdated failed with exit code {ExitCode}: {Error}", process.ExitCode, error);
                throw new InvalidOperationException($"dotnet-outdated failed: {error}");
            }

            // JSON ファイルから読み込む
            if (!File.Exists(outputFilePath))
            {
                throw new InvalidOperationException($"dotnet-outdated did not create output file: {outputFilePath}");
            }

            var jsonContent = await File.ReadAllTextAsync(outputFilePath, cancellationToken);

            var result = JsonSerializer.Deserialize<OutdatedResult>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? throw new InvalidOperationException("Failed to parse dotnet-outdated output");

            _logger.LogInformation("Found {ProjectCount} projects to analyze", result.Projects.Count);
            return result;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse JSON output from dotnet-outdated");
            throw new InvalidOperationException("Failed to parse dotnet-outdated output", ex);
        }
        finally
        {
            // 一時ファイルを削除
            if (File.Exists(outputFilePath))
            {
                try
                {
                    File.Delete(outputFilePath);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete output file: {OutputFile}", outputFilePath);
                }
            }
        }
    }

    /// <summary>
    /// dotnet-outdated ツールがインストールされているか確認
    /// </summary>
    private async Task<bool> IsDotnetOutdatedInstalledAsync(CancellationToken cancellationToken)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                Arguments = "tool list --global",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = startInfo };
            process.Start();

            var output = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            await process.WaitForExitAsync(cancellationToken);

            return output.Contains("dotnet-outdated-tool");
        }
        catch
        {
            return false;
        }
    }
}
