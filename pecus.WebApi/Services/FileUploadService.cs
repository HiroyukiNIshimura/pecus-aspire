using Microsoft.EntityFrameworkCore;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Models.Config;

namespace Pecus.Services;

/// <summary>
/// ファイルアップロードサービス
/// </summary>
public class FileUploadService
{
    private readonly ApplicationDbContext _context;
    private readonly PecusConfig _config;
    private readonly ILogger<FileUploadService> _logger;

    public FileUploadService(
        ApplicationDbContext context,
        PecusConfig config,
        ILogger<FileUploadService> logger
    )
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// ファイルをアップロード
    /// </summary>
    /// <param name="file">アップロードするファイル</param>
    /// <param name="fileType">ファイルの種類（avatar, genre など）</param>
    /// <param name="resourceId">リソースID</param>
    /// <param name="organizationId">組織ID</param>
    /// <returns>ファイルパス</returns>
    public async Task<string> UploadFileAsync(
        IFormFile file,
        string fileType,
        int resourceId,
        int organizationId
    )
    {
        // ファイルサイズチェック
        if (!FileUploadHelper.IsAllowedFileSize(file.Length, _config.FileUpload.MaxFileSize))
        {
            throw new InvalidOperationException(
                $"ファイルサイズが大きすぎます。最大サイズ: {_config.FileUpload.MaxFileSize / 1024 / 1024}MB"
            );
        }

        // 拡張子チェック
        var extension = FileUploadHelper.GetFileExtension(file.FileName);
        if (
            !FileUploadHelper.IsAllowedExtension(
                extension,
                _config.FileUpload.AllowedImageExtensions
            )
        )
        {
            throw new InvalidOperationException($"許可されていないファイル形式です: {extension}");
        }

        // MIMEタイプチェック
        if (
            !FileUploadHelper.IsAllowedMimeType(
                file.ContentType,
                _config.FileUpload.AllowedMimeTypes
            )
        )
        {
            throw new InvalidOperationException(
                $"許可されていないファイル形式です: {file.ContentType}"
            );
        }

        // ファイルパスを生成
        var filePath = FileUploadHelper.GenerateFilePath(
            organizationId,
            fileType,
            resourceId,
            extension,
            _config.FileUpload.StoragePath
        );

        // ディレクトリを作成
        FileUploadHelper.EnsureDirectoryExists(filePath);

        // ファイルを保存
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // 画像ファイルの場合、リサイズ処理を実行
        if (IsImageFile(extension))
        {
            try
            {
                // リサイズが必要かチェック
                if (await ImageHelper.NeedsResizeAsync(filePath))
                {
                    // 元ファイルを_orgサフィックス付きでバックアップ
                    var originalFilePath = ImageHelper.GenerateOriginalFilePath(filePath);
                    File.Move(filePath, originalFilePath);

                    // 48x48にリサイズしたファイルを作成
                    await ImageHelper.ResizeImageAsync(originalFilePath, filePath, 48, 48);

                    _logger.LogInformation(
                        "画像をリサイズしました。Original: {OriginalPath}, Resized: {ResizedPath}",
                        originalFilePath,
                        filePath
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "画像のリサイズに失敗しました。元ファイルをそのまま使用します。FilePath: {FilePath}",
                    filePath
                );
                // リサイズに失敗した場合は元ファイルをそのまま使用
            }
        }

        _logger.LogInformation(
            "ファイルをアップロードしました。FilePath: {FilePath}, FileType: {FileType}, ResourceId: {ResourceId}, OrganizationId: {OrganizationId}",
            filePath,
            fileType,
            resourceId,
            organizationId
        );

        return filePath;
    }

    /// <summary>
    /// ファイルを削除
    /// </summary>
    public void DeleteFile(string filePath)
    {
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            _logger.LogInformation("ファイルを削除しました。FilePath: {FilePath}", filePath);
        }
        else
        {
            _logger.LogDebug("削除対象のファイルが存在しません。FilePath: {FilePath}", filePath);
        }
    }

    /// <summary>
    /// 古いファイルを削除して新しいファイルをアップロード
    /// </summary>
    public async Task<string> ReplaceFileAsync(
        IFormFile file,
        string fileType,
        int resourceId,
        int organizationId,
        string? oldFilePath
    )
    {
        // 新しいファイルをアップロード
        var newFilePath = await UploadFileAsync(file, fileType, resourceId, organizationId);

        // 古いファイルを削除
        if (!string.IsNullOrEmpty(oldFilePath))
        {
            DeleteFile(oldFilePath);

            // 古いオリジナルファイル（_orgサフィックス付き）も削除
            var oldOriginalFilePath = ImageHelper.GenerateOriginalFilePath(oldFilePath);
            DeleteFile(oldOriginalFilePath);
        }

        return newFilePath;
    }

    /// <summary>
    /// リソースが存在し、指定された組織に所属しているか確認（ユーザーの場合）
    /// </summary>
    public async Task<bool> ValidateUserResourceAsync(int resourceId, int organizationId)
    {
        var user = await _context.Users.FindAsync(resourceId);
        return user?.OrganizationId == organizationId;
    }

    /// <summary>
    /// ジャンルリソースが存在するか確認
    /// </summary>
    public async Task<bool> ValidateGenreResourceAsync(int resourceId)
    {
        var genre = await _context.Genres.FindAsync(resourceId);
        return genre != null;
    }

    /// <summary>
    /// ファイルが画像ファイルかチェック
    /// </summary>
    private static bool IsImageFile(string extension)
    {
        var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        return imageExtensions.Contains(extension.ToLowerInvariant());
    }
}