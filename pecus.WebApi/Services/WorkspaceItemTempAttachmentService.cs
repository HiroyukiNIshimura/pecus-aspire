using Pecus.Libs.Image;
using Pecus.Models.Config;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace Pecus.Services;

/// <summary>
/// 一時添付ファイル管理サービス（アイテム作成前のファイルアップロード用）
/// </summary>
public class WorkspaceItemTempAttachmentService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<WorkspaceItemTempAttachmentService> _logger;
    private readonly PecusConfig _config;

    public WorkspaceItemTempAttachmentService(
        IWebHostEnvironment environment,
        ILogger<WorkspaceItemTempAttachmentService> logger,
        PecusConfig config)
    {
        _environment = environment;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// ストレージのベースパスを取得（絶対パス or ContentRootPath + 相対パス）
    /// </summary>
    private string GetStorageBasePath()
    {
        var storagePath = _config.FileUpload.StoragePath;
        if (Path.IsPathRooted(storagePath))
        {
            return storagePath;
        }
        return Path.Combine(_environment.ContentRootPath, storagePath);
    }

    /// <summary>
    /// 一時ファイルをアップロード
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="sessionId">セッション識別子（フロントで生成したUUID等）</param>
    /// <param name="file">アップロードするファイル</param>
    /// <param name="uploadedByUserId">アップロードユーザーID</param>
    /// <returns>一時ファイル情報</returns>
    public async Task<TempAttachmentResponse> UploadTempFileAsync(
        int workspaceId,
        string sessionId,
        IFormFile file,
        int uploadedByUserId)
    {
        // ファイルサイズの検証
        if (file.Length > _config.FileUpload.MaxAttachmentFileSize)
        {
            var maxSizeMB = _config.FileUpload.MaxAttachmentFileSize / 1024 / 1024;
            throw new InvalidOperationException(
                $"ファイルサイズが大きすぎます。最大サイズ: {maxSizeMB}MB"
            );
        }

        // 拡張子の検証
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_config.FileUpload.AllowedAttachmentExtensions.Contains(
                extension, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"許可されていないファイル形式です: {extension}。許可されている形式: {string.Join(", ", _config.FileUpload.AllowedAttachmentExtensions)}"
            );
        }

        // MIMEタイプの検証
        if (!_config.FileUpload.AllowedAttachmentMimeTypes.Contains(
                file.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"許可されていないファイル形式です: {file.ContentType}。ファイルの種類を確認してください。"
            );
        }

        var tempFileId = Guid.NewGuid().ToString();
        var originalFileName = Path.GetFileName(file.FileName);
        var storedFileName = $"{tempFileId}_{originalFileName}";

        // 一時フォルダパス: {StoragePath}/temp/{workspaceId}/{sessionId}/
        var tempFolder = Path.Combine(
            GetStorageBasePath(),
            "temp",
            workspaceId.ToString(),
            sessionId);

        Directory.CreateDirectory(tempFolder);

        var filePath = Path.Combine(tempFolder, storedFileName);

        // ファイルを保存（ストリームを確実にクローズしてからサムネイル生成）
        await using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream);
            await stream.FlushAsync();
        }

        // 画像の場合はサムネイルも生成（一時ファイルはDB保存しないため同期生成）
        if (ThumbnailHelper.IsImageFile(file.ContentType))
        {
            try
            {
                var mediumSize = _config.FileUpload.ThumbnailMediumSize;
                var smallSize = _config.FileUpload.ThumbnailSmallSize;

                var thumbnailMediumPath = ThumbnailHelper.GenerateThumbnailPath(filePath, "medium");
                var thumbnailSmallPath = ThumbnailHelper.GenerateThumbnailPath(filePath, "small");

                await CreateThumbnailAsync(
                    sourcePath: filePath,
                    destinationPath: thumbnailMediumPath,
                    maxWidth: mediumSize,
                    maxHeight: mediumSize);

                await CreateThumbnailAsync(
                    sourcePath: filePath,
                    destinationPath: thumbnailSmallPath,
                    maxWidth: smallSize,
                    maxHeight: smallSize);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create thumbnails for temp file: {TempFileId}", tempFileId);
                // サムネイル生成失敗は致命的エラーではないので続行
            }
        }

        _logger.LogDebug(
            "Temp file uploaded: {TempFileId} for workspace {WorkspaceId}, session {SessionId}, user {UserId}",
            tempFileId, workspaceId, sessionId, uploadedByUserId);

        return new TempAttachmentResponse
        {
            TempFileId = tempFileId,
            SessionId = sessionId,
            FileName = file.FileName,
            FileSize = file.Length,
            MimeType = file.ContentType,
            PreviewUrl = $"/api/workspaces/{workspaceId}/temp-attachments/{sessionId}/{storedFileName}"
        };
    }

    /// <summary>
    /// 一時ファイルのパスを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="sessionId">セッションID</param>
    /// <param name="fileName">ファイル名</param>
    /// <returns>ファイルパス（存在する場合）</returns>
    public string? GetTempFilePath(int workspaceId, string sessionId, string fileName)
    {
        var filePath = Path.Combine(
            GetStorageBasePath(),
            "temp",
            workspaceId.ToString(),
            sessionId,
            fileName);

        return File.Exists(filePath) ? filePath : null;
    }

    /// <summary>
    /// 一時ファイル情報を取得（正式化用）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="sessionId">セッションID</param>
    /// <param name="tempFileId">一時ファイルID</param>
    /// <returns>ファイル情報（存在する場合）</returns>
    public TempFileInfo? GetTempFileInfo(int workspaceId, string sessionId, string tempFileId)
    {
        var tempFolder = Path.Combine(
            GetStorageBasePath(),
            "temp",
            workspaceId.ToString(),
            sessionId);

        if (!Directory.Exists(tempFolder))
        {
            return null;
        }

        // 一時ファイルを検索（ファイル名形式: {tempFileId}_{originalFileName}）
        var tempFiles = Directory.GetFiles(tempFolder, $"{tempFileId}_*")
            .Where(f => !f.Contains("_medium.") && !f.Contains("_small.")) // サムネイルを除外
            .ToArray();

        if (tempFiles.Length == 0)
        {
            return null;
        }

        var tempFilePath = tempFiles[0];
        var fileInfo = new FileInfo(tempFilePath);
        var extension = fileInfo.Extension;

        // サムネイルパスを取得（ThumbnailHelper形式）
        var thumbnailMediumPath = ThumbnailHelper.GenerateThumbnailPath(tempFilePath, "medium");
        var thumbnailSmallPath = ThumbnailHelper.GenerateThumbnailPath(tempFilePath, "small");

        return new TempFileInfo
        {
            FilePath = tempFilePath,
            FileName = fileInfo.Name,
            FileSize = fileInfo.Length,
            Extension = extension,
            ThumbnailMediumPath = File.Exists(thumbnailMediumPath) ? thumbnailMediumPath : null,
            ThumbnailSmallPath = File.Exists(thumbnailSmallPath) ? thumbnailSmallPath : null
        };
    }

    /// <summary>
    /// 一時ファイルを正式な添付ファイルとして移動
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="sessionId">セッションID</param>
    /// <param name="tempFileId">一時ファイルID</param>
    /// <param name="workspaceItemId">ワークスペースアイテムID</param>
    /// <returns>移動後のファイル情報</returns>
    public async Task<PromotedFileInfo> PromoteTempFileAsync(
        int workspaceId,
        string sessionId,
        string tempFileId,
        int workspaceItemId)
    {
        var tempFileInfo = GetTempFileInfo(workspaceId, sessionId, tempFileId);
        if (tempFileInfo == null)
        {
            throw new FileNotFoundException($"Temp file not found: {tempFileId}");
        }

        // 元のファイル名を抽出（{tempFileId}_{originalFileName} 形式から）
        var originalFileName = tempFileInfo.FileName;
        if (originalFileName.StartsWith($"{tempFileId}_"))
        {
            originalFileName = originalFileName.Substring(tempFileId.Length + 1);
        }

        var newFileId = Guid.NewGuid().ToString();
        var newFileName = $"{newFileId}_{originalFileName}";

        // 正式フォルダパス: {StoragePath}/workspaces/{workspaceId}/items/{itemId}/
        var permanentFolder = Path.Combine(
            GetStorageBasePath(),
            "workspaces",
            workspaceId.ToString(),
            "items",
            workspaceItemId.ToString());

        Directory.CreateDirectory(permanentFolder);

        var newFilePath = Path.Combine(permanentFolder, newFileName);

        // ファイルを移動
        File.Move(tempFileInfo.FilePath, newFilePath);

        // サムネイルも移動（ThumbnailHelper形式）
        string? newThumbnailMediumPath = null;
        string? newThumbnailSmallPath = null;

        if (tempFileInfo.ThumbnailMediumPath != null)
        {
            newThumbnailMediumPath = ThumbnailHelper.GenerateThumbnailPath(newFilePath, "medium");
            File.Move(tempFileInfo.ThumbnailMediumPath, newThumbnailMediumPath);
        }

        if (tempFileInfo.ThumbnailSmallPath != null)
        {
            newThumbnailSmallPath = ThumbnailHelper.GenerateThumbnailPath(newFilePath, "small");
            File.Move(tempFileInfo.ThumbnailSmallPath, newThumbnailSmallPath);
        }

        _logger.LogDebug(
            "Temp file promoted: {TempFileId} -> Item {WorkspaceItemId}, new path: {NewFilePath}",
            tempFileId, workspaceItemId, newFilePath);

        var downloadUrl = $"/api/workspaces/{workspaceId}/items/{workspaceItemId}/attachments/{newFileName}";

        return new PromotedFileInfo
        {
            NewFilePath = newFilePath,
            DownloadUrl = downloadUrl,
            OriginalFileName = originalFileName,
            ThumbnailMediumPath = newThumbnailMediumPath,
            ThumbnailSmallPath = newThumbnailSmallPath,
            FileSize = tempFileInfo.FileSize
        };
    }

    /// <summary>
    /// セッションの一時ファイルをすべて削除
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="sessionId">セッションID</param>
    public void CleanupSessionFiles(int workspaceId, string sessionId)
    {
        var tempFolder = Path.Combine(
            GetStorageBasePath(),
            "temp",
            workspaceId.ToString(),
            sessionId);

        if (Directory.Exists(tempFolder))
        {
            Directory.Delete(tempFolder, recursive: true);
            _logger.LogDebug(
                "Cleaned up temp files for workspace {WorkspaceId}, session {SessionId}",
                workspaceId, sessionId);
        }
    }

    /// <summary>
    /// 古い一時ファイルをクリーンアップ（Hangfireバッチ用）
    /// </summary>
    /// <param name="olderThanHours">指定時間より古いファイルを削除</param>
    /// <returns>削除したセッション数</returns>
    public int CleanupOldTempFiles(int olderThanHours = 24)
    {
        var tempRoot = Path.Combine(GetStorageBasePath(), "temp");

        if (!Directory.Exists(tempRoot))
        {
            return 0;
        }

        var cutoffTime = DateTime.UtcNow.AddHours(-olderThanHours);
        var deletedCount = 0;

        // ワークスペースディレクトリを走査
        foreach (var workspaceDir in Directory.GetDirectories(tempRoot))
        {
            // セッションディレクトリを走査
            foreach (var sessionDir in Directory.GetDirectories(workspaceDir))
            {
                var dirInfo = new DirectoryInfo(sessionDir);
                if (dirInfo.CreationTimeUtc < cutoffTime)
                {
                    try
                    {
                        Directory.Delete(sessionDir, recursive: true);
                        deletedCount++;
                        _logger.LogDebug("Deleted old temp session: {SessionDir}", sessionDir);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete temp session: {SessionDir}", sessionDir);
                    }
                }
            }

            // 空のワークスペースディレクトリも削除
            if (Directory.GetDirectories(workspaceDir).Length == 0)
            {
                try
                {
                    Directory.Delete(workspaceDir);
                }
                catch
                {
                    // 空でなければ削除できないので無視
                }
            }
        }

        return deletedCount;
    }

    /// <summary>
    /// サムネイルを作成（リトライ付き）
    /// </summary>
    /// <param name="sourcePath">元画像パス</param>
    /// <param name="destinationPath">サムネイル保存先パス</param>
    /// <param name="maxWidth">最大幅</param>
    /// <param name="maxHeight">最大高さ</param>
    /// <param name="maxRetries">最大リトライ回数</param>
    private static async Task CreateThumbnailAsync(
        string sourcePath,
        string destinationPath,
        int maxWidth,
        int maxHeight,
        int maxRetries = 3)
    {
        for (var attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                // FileShare.Read を指定してファイルを開く（他プロセスとの競合を回避）
                await using var sourceStream = new FileStream(
                    sourcePath,
                    FileMode.Open,
                    FileAccess.Read,
                    FileShare.Read,
                    bufferSize: 4096,
                    useAsync: true);

                using var image = await Image.LoadAsync(sourceStream);

                // アスペクト比を維持してリサイズ
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Size = new Size(maxWidth, maxHeight),
                    Mode = ResizeMode.Max
                }));

                await image.SaveAsync(destinationPath);
                return;
            }
            catch (IOException) when (attempt < maxRetries - 1)
            {
                // ファイルがまだロックされている場合は少し待ってリトライ
                await Task.Delay(100 * (attempt + 1));
            }
        }
    }
}

/// <summary>
/// 一時ファイル情報
/// </summary>
public class TempFileInfo
{
    public required string FilePath { get; set; }
    public required string FileName { get; set; }
    public required long FileSize { get; set; }
    public required string Extension { get; set; }
    public string? ThumbnailMediumPath { get; set; }
    public string? ThumbnailSmallPath { get; set; }
}

/// <summary>
/// 正式化されたファイル情報
/// </summary>
public class PromotedFileInfo
{
    public required string NewFilePath { get; set; }
    public required string DownloadUrl { get; set; }
    /// <summary>
    /// 元のファイル名（UUID プレフィックスなし）
    /// </summary>
    public required string OriginalFileName { get; set; }
    public string? ThumbnailMediumPath { get; set; }
    public string? ThumbnailSmallPath { get; set; }
    public long FileSize { get; set; }
}