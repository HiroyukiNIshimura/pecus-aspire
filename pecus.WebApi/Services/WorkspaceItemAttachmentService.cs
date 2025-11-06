using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;

namespace Pecus.Services;

/// <summary>
/// ワークスペースアイテムの添付ファイル管理サービス
/// </summary>
public class WorkspaceItemAttachmentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkspaceItemAttachmentService> _logger;
    private readonly PecusConfig _config;
    private readonly OrganizationAccessHelper _accessHelper;

    public WorkspaceItemAttachmentService(
        ApplicationDbContext context,
        ILogger<WorkspaceItemAttachmentService> logger,
        PecusConfig config,
        OrganizationAccessHelper accessHelper
    )
    {
        _context = context;
        _logger = logger;
        _config = config;
        _accessHelper = accessHelper;
    }

    /// <summary>
    /// ワークスペースアイテムに添付ファイルを追加
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="fileName">ファイル名</param>
    /// <param name="fileSize">ファイルサイズ</param>
    /// <param name="mimeType">MIMEタイプ</param>
    /// <param name="filePath">サーバー上のファイルパス</param>
    /// <param name="downloadUrl">ダウンロードURL</param>
    /// <param name="thumbnailMediumPath">サムネイル（M）パス</param>
    /// <param name="thumbnailSmallPath">サムネイル（S）パス</param>
    /// <param name="userId">アップロードユーザーID</param>
    /// <returns>作成された添付ファイル</returns>
    public async Task<WorkspaceItemAttachment> AddAttachmentAsync(
        int workspaceId,
        int itemId,
        string fileName,
        long fileSize,
        string mimeType,
        string filePath,
        string downloadUrl,
        string? thumbnailMediumPath,
        string? thumbnailSmallPath,
        int userId
    )
    {
        // ファイルサイズの検証
        if (fileSize > _config.FileUpload.MaxAttachmentFileSize)
        {
            var maxSizeMB = _config.FileUpload.MaxAttachmentFileSize / 1024 / 1024;
            throw new InvalidOperationException(
                $"ファイルサイズが大きすぎます。最大サイズ: {maxSizeMB}MB"
            );
        }

        // 拡張子の検証
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (
            !_config.FileUpload.AllowedAttachmentExtensions.Contains(
                extension,
                StringComparer.OrdinalIgnoreCase
            )
        )
        {
            throw new InvalidOperationException(
                $"許可されていないファイル形式です: {extension}。許可されている形式: {string.Join(", ", _config.FileUpload.AllowedAttachmentExtensions)}"
            );
        }

        // MIMEタイプの検証
        if (
            !_config.FileUpload.AllowedAttachmentMimeTypes.Contains(
                mimeType,
                StringComparer.OrdinalIgnoreCase
            )
        )
        {
            throw new InvalidOperationException(
                $"許可されていないファイル形式です: {mimeType}。ファイルの種類を確認してください。"
            );
        }

        // アイテムの存在確認
        var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.WorkspaceId == workspaceId && wi.Id == itemId
        );

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        var attachment = new WorkspaceItemAttachment
        {
            WorkspaceItemId = itemId,
            FileName = fileName,
            FileSize = fileSize,
            MimeType = mimeType,
            FilePath = filePath,
            DownloadUrl = downloadUrl,
            ThumbnailMediumPath = thumbnailMediumPath,
            ThumbnailSmallPath = thumbnailSmallPath,
            UploadedAt = DateTime.UtcNow,
            UploadedByUserId = userId,
        };

        _context.WorkspaceItemAttachments.Add(attachment);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // 最新データを取得
            var latestAttachment = await _context.WorkspaceItemAttachments.FindAsync(attachment.Id);
            throw new ConcurrencyException<WorkspaceItemAttachment>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestAttachment
            );
        }

        // ナビゲーションプロパティをロード
        await _context.Entry(attachment).Reference(a => a.UploadedByUser).LoadAsync();

        return attachment;
    }

    /// <summary>
    /// ワークスペースアイテムの添付ファイル一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>添付ファイル一覧</returns>
    public async Task<List<WorkspaceItemAttachment>> GetAttachmentsAsync(
        int workspaceId,
        int itemId
    )
    {
        // アイテムの存在確認
        var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.WorkspaceId == workspaceId && wi.Id == itemId
        );

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        return await _context
            .WorkspaceItemAttachments.Include(a => a.UploadedByUser)
            .Where(a => a.WorkspaceItemId == itemId)
            .OrderBy(a => a.UploadedAt)
            .ToListAsync();
    }

    /// <summary>
    /// 添付ファイルを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="attachmentId">添付ファイルID</param>
    /// <returns>添付ファイル</returns>
    public async Task<WorkspaceItemAttachment> GetAttachmentAsync(
        int workspaceId,
        int itemId,
        int attachmentId
    )
    {
        var attachment = await _context
            .WorkspaceItemAttachments.Include(a => a.WorkspaceItem)
            .Include(a => a.UploadedByUser)
            .FirstOrDefaultAsync(a =>
                a.Id == attachmentId
                && a.WorkspaceItemId == itemId
                && a.WorkspaceItem!.WorkspaceId == workspaceId
            );

        if (attachment == null)
        {
            throw new NotFoundException("添付ファイルが見つかりません。");
        }

        return attachment;
    }

    /// <summary>
    /// 添付ファイルを削除
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="attachmentId">添付ファイルID</param>
    /// <param name="userId">削除ユーザーID</param>
    /// <returns>削除された添付ファイル情報</returns>
    public async Task<WorkspaceItemAttachment> DeleteAttachmentAsync(
        int workspaceId,
        int itemId,
        int attachmentId,
        int userId
    )
    {
        var attachment = await GetAttachmentAsync(workspaceId, itemId, attachmentId);

        // アイテムのオーナーまたはアップロードしたユーザーのみ削除可能
        var item = await _context.WorkspaceItems.FindAsync(itemId);
        if (item != null && item.OwnerId != userId && attachment.UploadedByUserId != userId)
        {
            throw new InvalidOperationException(
                "アイテムのオーナーまたはアップロードしたユーザーのみが削除できます。"
            );
        }

        _context.WorkspaceItemAttachments.Remove(attachment);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyException<WorkspaceItemAttachment>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                attachment
            );
        }

        return attachment;
    }
}
