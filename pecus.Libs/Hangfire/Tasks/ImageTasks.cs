using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.Image;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// 画像処理関連のHangfireタスク
/// </summary>
public class ImageTasks
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ImageTasks> _logger;

    /// <summary>
    /// ImageTasks のコンストラクタ
    /// </summary>
    /// <param name="context">データベースコンテキスト</param>
    /// <param name="logger">ロガー</param>
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
            if (!ThumbnailHelper.IsImageFile(attachment.MimeType))
            {
                _logger.LogInformation(
                    "画像ファイルではないためスキップ: MimeType={MimeType}",
                    attachment.MimeType
                );
                return;
            }

            // DBに既にサムネイルパスが保存されているか確認
            if (
                string.IsNullOrEmpty(attachment.ThumbnailMediumPath)
                || string.IsNullOrEmpty(attachment.ThumbnailSmallPath)
            )
            {
                _logger.LogWarning(
                    "サムネイルパスがDBに保存されていません: AttachmentId={AttachmentId}",
                    attachmentId
                );
                return;
            }

            var storedMediumPath = attachment.ThumbnailMediumPath;
            var storedSmallPath = attachment.ThumbnailSmallPath;
            var isGif = string.Equals(
                attachment.MimeType,
                "image/gif",
                StringComparison.OrdinalIgnoreCase
            );
            var mediumThumbnailPath = isGif
                ? ThumbnailHelper.GenerateThumbnailPath(sourceFilePath, "medium")
                : storedMediumPath;
            var smallThumbnailPath = isGif
                ? ThumbnailHelper.GenerateThumbnailPath(sourceFilePath, "small")
                : storedSmallPath;

            // Mediumサムネイル生成
            var thumbnailMediumSuccess = await GenerateThumbnailAsync(
                sourceFilePath,
                mediumThumbnailPath!,
                mediumSize
            );

            // Smallサムネイル生成
            var thumbnailSmallSuccess = await GenerateThumbnailAsync(
                sourceFilePath,
                smallThumbnailPath!,
                smallSize
            );

            var thumbnailPathsUpdated = false;
            if (
                thumbnailMediumSuccess
                && !string.Equals(storedMediumPath, mediumThumbnailPath, StringComparison.Ordinal)
            )
            {
                attachment.ThumbnailMediumPath = mediumThumbnailPath;
                thumbnailPathsUpdated = true;
            }

            if (
                thumbnailSmallSuccess
                && !string.Equals(storedSmallPath, smallThumbnailPath, StringComparison.Ordinal)
            )
            {
                attachment.ThumbnailSmallPath = smallThumbnailPath;
                thumbnailPathsUpdated = true;
            }

            if (thumbnailPathsUpdated)
            {
                await _context.SaveChangesAsync();

                if (
                    thumbnailMediumSuccess
                    && !string.Equals(storedMediumPath, mediumThumbnailPath, StringComparison.Ordinal)
                )
                {
                    TryDeleteObsoleteThumbnail(storedMediumPath);
                }

                if (
                    thumbnailSmallSuccess
                    && !string.Equals(storedSmallPath, smallThumbnailPath, StringComparison.Ordinal)
                )
                {
                    TryDeleteObsoleteThumbnail(storedSmallPath);
                }
            }

            _logger.LogInformation(
                "サムネイル生成完了: AttachmentId={AttachmentId}, Medium={MediumSuccess}, Small={SmallSuccess}",
                attachmentId,
                thumbnailMediumSuccess,
                thumbnailSmallSuccess
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
    /// <param name="sourceFilePath">元ファイルのパス</param>
    /// <param name="thumbnailPath">生成するサムネイルのパス</param>
    /// <param name="maxDimension">最大サイズ（px）</param>
    /// <returns>生成成功の場合true</returns>
    private async Task<bool> GenerateThumbnailAsync(
        string sourceFilePath,
        string thumbnailPath,
        int maxDimension
    )
    {
        try
        {
            await ImageProcessingHelper.ResizeAsync(
                sourceFilePath: sourceFilePath,
                destinationFilePath: thumbnailPath,
                maxWidth: maxDimension,
                maxHeight: maxDimension
            );

            _logger.LogDebug(
                "サムネイル生成: MaxDimension={MaxDimension}, Path={Path}",
                maxDimension,
                thumbnailPath
            );

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "サムネイル生成エラー: ThumbnailPath={ThumbnailPath}, SourceFile={SourceFile}",
                thumbnailPath,
                sourceFilePath
            );
            return false;
        }
    }

    private void TryDeleteObsoleteThumbnail(string? thumbnailPath)
    {
        if (string.IsNullOrEmpty(thumbnailPath) || !File.Exists(thumbnailPath))
        {
            return;
        }

        try
        {
            File.Delete(thumbnailPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "旧サムネイルの削除に失敗しました: ThumbnailPath={ThumbnailPath}",
                thumbnailPath
            );
        }
    }

    /// <summary>
    /// ファイルが画像かどうかを判定
    /// </summary>
    private static bool IsImageFile(string mimeType)
    {
        return ThumbnailHelper.IsImageFile(mimeType);
    }
}