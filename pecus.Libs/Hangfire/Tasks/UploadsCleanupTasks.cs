using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// アップロードフォルダのクリーンアップタスク
/// </summary>
public class UploadsCleanupTasks
{
    private readonly ILogger<UploadsCleanupTasks> _logger;
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="logger"></param>
    /// <param name="context"></param>
    public UploadsCleanupTasks(ILogger<UploadsCleanupTasks> logger, ApplicationDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// アップロードフォルダのクリーンアップを実行します。
    /// - temp フォルダの古いファイル/フォルダを削除
    /// - 存在しないユーザーのアバターフォルダを削除
    /// - 存在しないジャンルのアイコンフォルダを削除
    /// - 存在しないワークスペースアイテムのフォルダを削除
    /// - 存在しないワークスペースのフォルダを削除
    /// - 存在しない組織のフォルダを削除
    /// </summary>
    /// <param name="uploadsBasePath">アップロードフォルダのベースパス</param>
    /// <param name="tempRetentionHours">tempフォルダ内のファイルを保持する時間（デフォルト: 24時間）</param>
    /// <returns></returns>
    public async Task CleanupUploadsAsync(string uploadsBasePath, int tempRetentionHours = 24)
    {
        _logger.LogInformation("Uploads cleanup started. basePath={BasePath} tempRetentionHours={Hours}", uploadsBasePath, tempRetentionHours);

        var totalDeleted = 0;

        // 1. temp フォルダのクリーンアップ
        totalDeleted += await CleanupTempFolderAsync(uploadsBasePath, tempRetentionHours);

        // 2. アバターフォルダのクリーンアップ（存在しないユーザー）
        totalDeleted += await CleanupAvatarFoldersAsync(uploadsBasePath);

        // 3. ジャンルフォルダのクリーンアップ（存在しないジャンル）
        totalDeleted += await CleanupGenreFoldersAsync(uploadsBasePath);

        // 4. ワークスペースアイテムフォルダのクリーンアップ
        totalDeleted += await CleanupWorkspaceItemFoldersAsync(uploadsBasePath);

        // 5. ワークスペースフォルダのクリーンアップ
        totalDeleted += await CleanupWorkspaceFoldersAsync(uploadsBasePath);

        // 6. 組織フォルダのクリーンアップ（存在しない組織）
        totalDeleted += await CleanupOrganizationFoldersAsync(uploadsBasePath);

        _logger.LogInformation("Uploads cleanup completed. totalDeleted={Total}", totalDeleted);
    }

    /// <summary>
    /// temp フォルダ内の古いファイル/フォルダを削除します
    /// </summary>
    private async Task<int> CleanupTempFolderAsync(string uploadsBasePath, int tempRetentionHours)
    {
        var tempPath = Path.Combine(uploadsBasePath, "temp");
        if (!Directory.Exists(tempPath))
        {
            return 0;
        }

        var cutoff = DateTime.UtcNow.AddHours(-tempRetentionHours);
        var deletedCount = 0;

        try
        {
            // ファイルを削除
            foreach (var file in Directory.GetFiles(tempPath, "*", SearchOption.AllDirectories))
            {
                try
                {
                    var fileInfo = new FileInfo(file);
                    if (fileInfo.LastWriteTimeUtc < cutoff)
                    {
                        File.Delete(file);
                        deletedCount++;
                        _logger.LogDebug("Deleted temp file: {File}", file);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete temp file: {File}", file);
                }
            }

            // 空のサブフォルダを削除
            foreach (var dir in Directory.GetDirectories(tempPath, "*", SearchOption.AllDirectories).OrderByDescending(d => d.Length))
            {
                try
                {
                    if (Directory.Exists(dir) && !Directory.EnumerateFileSystemEntries(dir).Any())
                    {
                        Directory.Delete(dir);
                        deletedCount++;
                        _logger.LogDebug("Deleted empty temp directory: {Dir}", dir);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete temp directory: {Dir}", dir);
                }
            }

            _logger.LogInformation("Temp folder cleanup completed. deletedCount={Count}", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup temp folder");
        }

        return deletedCount;
    }

    /// <summary>
    /// 存在しないユーザーのアバターフォルダを削除します
    /// uploads/organizations/[orgId]/avatar/[userId] 形式
    /// </summary>
    private async Task<int> CleanupAvatarFoldersAsync(string uploadsBasePath)
    {
        var deletedCount = 0;
        var organizationsPath = Path.Combine(uploadsBasePath, "organizations");

        if (!Directory.Exists(organizationsPath))
        {
            return 0;
        }

        try
        {
            // 全ユーザーIDを取得
            var existingUserIds = await _context.Users
                .Select(u => u.Id)
                .ToHashSetAsync();

            // 組織フォルダを走査
            foreach (var orgDir in Directory.GetDirectories(organizationsPath))
            {
                var orgDirName = Path.GetFileName(orgDir);
                // 数値として解釈できないフォルダはスキップ
                if (!int.TryParse(orgDirName, out _))
                {
                    continue;
                }

                var avatarPath = Path.Combine(orgDir, "avatar");
                if (!Directory.Exists(avatarPath))
                {
                    continue;
                }

                foreach (var userDir in Directory.GetDirectories(avatarPath))
                {
                    var userDirName = Path.GetFileName(userDir);
                    if (int.TryParse(userDirName, out var userId) && !existingUserIds.Contains(userId))
                    {
                        try
                        {
                            Directory.Delete(userDir, recursive: true);
                            deletedCount++;
                            _logger.LogInformation("Deleted orphaned avatar folder for userId={UserId}: {Path}", userId, userDir);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to delete avatar folder: {Path}", userDir);
                        }
                    }
                }
            }

            _logger.LogInformation("Avatar folder cleanup completed. deletedCount={Count}", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup avatar folders");
        }

        return deletedCount;
    }

    /// <summary>
    /// 存在しないジャンルのアイコンフォルダを削除します
    /// uploads/organizations/[orgId]/genre/[genreId] 形式
    /// </summary>
    private async Task<int> CleanupGenreFoldersAsync(string uploadsBasePath)
    {
        var deletedCount = 0;
        var organizationsPath = Path.Combine(uploadsBasePath, "organizations");

        if (!Directory.Exists(organizationsPath))
        {
            return 0;
        }

        try
        {
            // 全ジャンルIDを取得
            var existingGenreIds = await _context.Genres
                .Select(g => g.Id)
                .ToHashSetAsync();

            // 組織フォルダを走査
            foreach (var orgDir in Directory.GetDirectories(organizationsPath))
            {
                var orgDirName = Path.GetFileName(orgDir);
                // 数値として解釈できないフォルダはスキップ
                if (!int.TryParse(orgDirName, out _))
                {
                    continue;
                }

                var genrePath = Path.Combine(orgDir, "genre");
                if (!Directory.Exists(genrePath))
                {
                    continue;
                }

                foreach (var genreDir in Directory.GetDirectories(genrePath))
                {
                    var genreDirName = Path.GetFileName(genreDir);
                    if (int.TryParse(genreDirName, out var genreId) && !existingGenreIds.Contains(genreId))
                    {
                        try
                        {
                            Directory.Delete(genreDir, recursive: true);
                            deletedCount++;
                            _logger.LogInformation("Deleted orphaned genre folder for genreId={GenreId}: {Path}", genreId, genreDir);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to delete genre folder: {Path}", genreDir);
                        }
                    }
                }
            }

            _logger.LogInformation("Genre folder cleanup completed. deletedCount={Count}", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup genre folders");
        }

        return deletedCount;
    }

    /// <summary>
    /// 存在しないワークスペースアイテムのフォルダを削除します
    /// uploads/workspaces/[workspaceId]/items/[itemId] 形式
    /// </summary>
    private async Task<int> CleanupWorkspaceItemFoldersAsync(string uploadsBasePath)
    {
        var deletedCount = 0;
        var workspacesPath = Path.Combine(uploadsBasePath, "workspaces");

        if (!Directory.Exists(workspacesPath))
        {
            return 0;
        }

        try
        {
            // 全ワークスペースアイテムIDを取得
            var existingItemIds = await _context.WorkspaceItems
                .Select(wi => wi.Id)
                .ToHashSetAsync();

            // ワークスペースフォルダを走査
            foreach (var workspaceDir in Directory.GetDirectories(workspacesPath))
            {
                var itemsPath = Path.Combine(workspaceDir, "items");
                if (!Directory.Exists(itemsPath))
                {
                    continue;
                }

                foreach (var itemDir in Directory.GetDirectories(itemsPath))
                {
                    var itemDirName = Path.GetFileName(itemDir);
                    if (int.TryParse(itemDirName, out var itemId) && !existingItemIds.Contains(itemId))
                    {
                        try
                        {
                            Directory.Delete(itemDir, recursive: true);
                            deletedCount++;
                            _logger.LogInformation("Deleted orphaned workspace item folder for itemId={ItemId}: {Path}", itemId, itemDir);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to delete workspace item folder: {Path}", itemDir);
                        }
                    }
                }
            }

            _logger.LogInformation("Workspace item folder cleanup completed. deletedCount={Count}", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup workspace item folders");
        }

        return deletedCount;
    }

    /// <summary>
    /// 存在しないワークスペースのフォルダを削除します
    /// uploads/workspaces/[workspaceId] 形式
    /// </summary>
    private async Task<int> CleanupWorkspaceFoldersAsync(string uploadsBasePath)
    {
        var deletedCount = 0;
        var workspacesPath = Path.Combine(uploadsBasePath, "workspaces");

        if (!Directory.Exists(workspacesPath))
        {
            return 0;
        }

        try
        {
            // 全ワークスペースIDを取得
            var existingWorkspaceIds = await _context.Workspaces
                .Select(w => w.Id)
                .ToHashSetAsync();

            foreach (var workspaceDir in Directory.GetDirectories(workspacesPath))
            {
                var workspaceDirName = Path.GetFileName(workspaceDir);
                if (int.TryParse(workspaceDirName, out var workspaceId) && !existingWorkspaceIds.Contains(workspaceId))
                {
                    try
                    {
                        Directory.Delete(workspaceDir, recursive: true);
                        deletedCount++;
                        _logger.LogInformation("Deleted orphaned workspace folder for workspaceId={WorkspaceId}: {Path}", workspaceId, workspaceDir);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete workspace folder: {Path}", workspaceDir);
                    }
                }
            }

            _logger.LogInformation("Workspace folder cleanup completed. deletedCount={Count}", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup workspace folders");
        }

        return deletedCount;
    }

    /// <summary>
    /// 存在しない組織のフォルダを削除します
    /// uploads/organizations/[orgId] 形式
    /// </summary>
    private async Task<int> CleanupOrganizationFoldersAsync(string uploadsBasePath)
    {
        var deletedCount = 0;
        var organizationsPath = Path.Combine(uploadsBasePath, "organizations");

        if (!Directory.Exists(organizationsPath))
        {
            return 0;
        }

        try
        {
            // 全組織IDを取得
            var existingOrgIds = await _context.Organizations
                .Select(o => o.Id)
                .ToHashSetAsync();

            foreach (var orgDir in Directory.GetDirectories(organizationsPath))
            {
                var orgDirName = Path.GetFileName(orgDir);

                // 数値として解釈できるフォルダ名のみが組織フォルダ
                if (int.TryParse(orgDirName, out var orgId) && !existingOrgIds.Contains(orgId))
                {
                    try
                    {
                        Directory.Delete(orgDir, recursive: true);
                        deletedCount++;
                        _logger.LogInformation("Deleted orphaned organization folder for orgId={OrgId}: {Path}", orgId, orgDir);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete organization folder: {Path}", orgDir);
                    }
                }
            }

            _logger.LogInformation("Organization folder cleanup completed. deletedCount={Count}", deletedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup organization folders");
        }

        return deletedCount;
    }
}