using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// 画像処理関連のHangfireタスク
/// </summary>
public class ImageTasks
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ImageTasks> _logger;

    public ImageTasks(ApplicationDbContext context, ILogger<ImageTasks> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// ワークスペースアイテム添付ファイルのサムネイルを生成
    /// </summary>
    /// <param name="attachmentId">添付ファイルID</param>
    /// <param name="sourceFilePath">元ファイルのパス</param>
    /// <param name="mediumSize">Mediumサムネイルのサイズ（px）</param>
    /// <param name="smallSize">Smallサムネイルのサイズ（px）</param>
    public async Task GenerateThumbnailsAsync(
        int attachmentId,
        string sourceFilePath,
        int mediumSize,
        int smallSize
    )
    {
        try
        {
            _logger.LogInformation(
                "サムネイル生成開始: AttachmentId={AttachmentId}, SourceFile={SourceFile}, MediumSize={MediumSize}, SmallSize={SmallSize}",
                attachmentId,
                sourceFilePath,
                mediumSize,
                smallSize
            );

            // 添付ファイル情報を取得
            var attachment = await _context
                .WorkspaceItemAttachments.Include(a => a.WorkspaceItem)
                .FirstOrDefaultAsync(a => a.Id == attachmentId);

            if (attachment == null)
            {
                _logger.LogWarning(
                    "添付ファイルが見つかりません: AttachmentId={AttachmentId}",
                    attachmentId
                );
                return;
            }

            // ファイルが存在しない場合は終了
            if (!File.Exists(sourceFilePath))
            {
                _logger.LogWarning(
                    "ソースファイルが見つかりません: FilePath={FilePath}",
                    sourceFilePath
                );
                return;
            }

            // 画像ファイルかチェック
            if (!IsImageFile(attachment.MimeType))
            {
                _logger.LogInformation(
                    "画像ファイルではないためスキップ: MimeType={MimeType}",
                    attachment.MimeType
                );
                return;
            }

            var outputDir = Path.GetDirectoryName(sourceFilePath);
            if (string.IsNullOrEmpty(outputDir))
            {
                _logger.LogError(
                    "出力ディレクトリを取得できません: {SourceFilePath}",
                    sourceFilePath
                );
                return;
            }

            var fileName = Path.GetFileName(sourceFilePath);

            // Mediumサムネイル生成
            var thumbnailMediumPath = await GenerateThumbnailAsync(
                sourceFilePath,
                outputDir,
                fileName,
                "medium",
                mediumSize
            );

            // Smallサムネイル生成
            var thumbnailSmallPath = await GenerateThumbnailAsync(
                sourceFilePath,
                outputDir,
                fileName,
                "small",
                smallSize
            );

            // DBを更新
            attachment.ThumbnailMediumPath = thumbnailMediumPath;
            attachment.ThumbnailSmallPath = thumbnailSmallPath;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "サムネイル生成完了: AttachmentId={AttachmentId}, Medium={Medium}, Small={Small}",
                attachmentId,
                thumbnailMediumPath,
                thumbnailSmallPath
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "サムネイル生成中にエラーが発生: AttachmentId={AttachmentId}",
                attachmentId
            );
            throw;
        }
    }

    /// <summary>
    /// サムネイルを生成
    /// </summary>
    private async Task<string?> GenerateThumbnailAsync(
        string sourceFilePath,
        string outputDir,
        string uniqueFileName,
        string size,
        int maxDimension
    )
    {
        try
        {
            var thumbnailFileName =
                $"{Path.GetFileNameWithoutExtension(uniqueFileName)}_{size}{Path.GetExtension(uniqueFileName)}";
            var thumbnailPath = Path.Combine(outputDir, thumbnailFileName);

            // 現在は簡易実装としてファイルをコピー
            // TODO: ImageSharp等の画像処理ライブラリを使用してリサイズ
            await Task.Run(() => File.Copy(sourceFilePath, thumbnailPath, true));

            _logger.LogDebug(
                "サムネイル生成: Size={Size}, MaxDimension={MaxDimension}, Path={Path}",
                size,
                maxDimension,
                thumbnailPath
            );

            return thumbnailPath;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "サムネイル生成エラー: Size={Size}, SourceFile={SourceFile}",
                size,
                sourceFilePath
            );
            return null;
        }
    }

    /// <summary>
    /// ファイルが画像かどうかを判定
    /// </summary>
    private static bool IsImageFile(string mimeType)
    {
        var imageMimeTypes = new[]
        {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/bmp",
        };
        return imageMimeTypes.Contains(mimeType.ToLowerInvariant());
    }
}
