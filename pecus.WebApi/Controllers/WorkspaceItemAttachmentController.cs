using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Image;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/workspaces/{workspaceId}/items/{itemId}/attachments")]
[Produces("application/json")]
[Tags("WorkspaceItem")]
public class WorkspaceItemAttachmentController : BaseSecureController
{
    private readonly WorkspaceItemAttachmentService _attachmentService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly PecusConfig _config;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public WorkspaceItemAttachmentController(
        WorkspaceItemAttachmentService attachmentService,
        OrganizationAccessHelper accessHelper,
        ILogger<WorkspaceItemAttachmentController> logger,
        PecusConfig config,
        IBackgroundJobClient backgroundJobClient,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _attachmentService = attachmentService;
        _accessHelper = accessHelper;
        _config = config;
        _backgroundJobClient = backgroundJobClient;
    }

    /// <summary>
    /// ワークスペースアイテムに添付ファイルをアップロード
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="file">アップロードするファイル</param>
    /// <returns>アップロードされた添付ファイル情報</returns>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceItemAttachmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<WorkspaceItemAttachmentResponse>> UploadAttachment(
        int workspaceId,
        int itemId,
        IFormFile file
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみが添付ファイルをアップロードできます。"
            );
        }

        if (file == null || file.Length == 0)
        {
            throw new InvalidOperationException("ファイルが指定されていません。");
        }

        // ファイル名とMIMEタイプを取得
        var fileName = Path.GetFileName(file.FileName);
        var mimeType = file.ContentType;

        // ファイルを保存するパスを生成
        var uploadsDir = Path.Combine(
            Directory.GetCurrentDirectory(),
            _config.FileUpload.StoragePath,
            "workspaces",
            workspaceId.ToString(),
            "items",
            itemId.ToString()
        );
        Directory.CreateDirectory(uploadsDir);

        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(uploadsDir, uniqueFileName);

        // ファイルを保存
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // ダウンロードURLを生成
        var downloadUrl =
            $"/api/workspaces/{workspaceId}/items/{itemId}/attachments/download/{uniqueFileName}";

        // 画像ファイルの場合、サムネイルパスを事前に計算
        string? thumbnailMediumPath = null;
        string? thumbnailSmallPath = null;

        if (ThumbnailHelper.IsImageFile(mimeType))
        {
            thumbnailMediumPath = ThumbnailHelper.GenerateThumbnailPath(filePath, "medium");
            thumbnailSmallPath = ThumbnailHelper.GenerateThumbnailPath(filePath, "small");
        }

        // DBに保存（サムネイルパスも保存）
        var attachment = await _attachmentService.AddAttachmentAsync(
            workspaceId,
            itemId,
            fileName,
            file.Length,
            mimeType,
            filePath,
            downloadUrl,
            thumbnailMediumPath,
            thumbnailSmallPath,
            CurrentUserId
        );

        // 画像ファイルの場合、バックグラウンドでサムネイル生成をキュー
        if (ThumbnailHelper.IsImageFile(mimeType))
        {
            var mediumSize = _config.FileUpload.ThumbnailMediumSize;
            var smallSize = _config.FileUpload.ThumbnailSmallSize;

            _backgroundJobClient.Enqueue<ImageTasks>(x =>
                x.GenerateThumbnailsAsync(attachment.Id, filePath, mediumSize, smallSize)
            );
        }

        var response = new WorkspaceItemAttachmentResponse
        {
            Id = attachment.Id,
            WorkspaceItemId = attachment.WorkspaceItemId,
            FileName = attachment.FileName,
            FileSize = attachment.FileSize,
            MimeType = attachment.MimeType,
            DownloadUrl = attachment.DownloadUrl,
            ThumbnailMediumUrl = attachment.ThumbnailMediumPath,
            ThumbnailSmallUrl = attachment.ThumbnailSmallPath,
            UploadedAt = attachment.UploadedAt,
            UploadedByUserId = attachment.UploadedByUserId,
            UploadedByUsername = attachment.UploadedByUser?.Username,
        };

        return TypedResults.Created(attachment.DownloadUrl, response);
    }

    /// <summary>
    /// ワークスペースアイテムの添付ファイル一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>添付ファイル一覧</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<WorkspaceItemAttachmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<WorkspaceItemAttachmentResponse>>> GetAttachments(
        int workspaceId,
        int itemId
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var attachments = await _attachmentService.GetAttachmentsAsync(workspaceId, itemId);

        var response = attachments
            .Select(a => new WorkspaceItemAttachmentResponse
            {
                Id = a.Id,
                WorkspaceItemId = a.WorkspaceItemId,
                FileName = a.FileName,
                FileSize = a.FileSize,
                MimeType = a.MimeType,
                DownloadUrl = a.DownloadUrl,
                ThumbnailMediumUrl = a.ThumbnailMediumPath,
                ThumbnailSmallUrl = a.ThumbnailSmallPath,
                UploadedAt = a.UploadedAt,
                UploadedByUserId = a.UploadedByUserId,
                UploadedByUsername = a.UploadedByUser?.Username,
            })
            .ToList();

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 添付ファイルを削除
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="attachmentId">添付ファイルID</param>
    /// <returns>削除結果</returns>
    [HttpDelete("{attachmentId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> DeleteAttachment(int workspaceId, int itemId, int attachmentId)
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみが添付ファイルを削除できます。"
            );
        }

        var attachment = await _attachmentService.DeleteAttachmentAsync(
            workspaceId,
            itemId,
            attachmentId,
            CurrentUserId
        );

        // 物理ファイルを削除
        if (System.IO.File.Exists(attachment.FilePath))
        {
            System.IO.File.Delete(attachment.FilePath);
        }

        // サムネイルも削除
        if (
            !string.IsNullOrEmpty(attachment.ThumbnailMediumPath)
            && System.IO.File.Exists(attachment.ThumbnailMediumPath)
        )
        {
            System.IO.File.Delete(attachment.ThumbnailMediumPath);
        }

        if (
            !string.IsNullOrEmpty(attachment.ThumbnailSmallPath)
            && System.IO.File.Exists(attachment.ThumbnailSmallPath)
        )
        {
            System.IO.File.Delete(attachment.ThumbnailSmallPath);
        }

        return TypedResults.NoContent();
    }

    /// <summary>
    /// 添付ファイルをダウンロード
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="fileName">ファイル名（一意なファイル名）</param>
    /// <returns>ファイル</returns>
    [HttpGet("download/{fileName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<FileContentHttpResult> DownloadAttachment(
        int workspaceId,
        int itemId,
        string fileName
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ファイルパスを構築
        var filePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            _config.FileUpload.StoragePath,
            "workspaces",
            workspaceId.ToString(),
            "items",
            itemId.ToString(),
            fileName
        );

        // ファイルの存在確認
        if (!System.IO.File.Exists(filePath))
        {
            throw new NotFoundException("ファイルが見つかりません。");
        }

        // DBから添付ファイル情報を取得して、権限チェックを行う
        var attachments = await _attachmentService.GetAttachmentsAsync(workspaceId, itemId);
        var attachment = attachments.FirstOrDefault(a =>
            a.FilePath == filePath || Path.GetFileName(a.FilePath) == fileName
        );

        if (attachment == null)
        {
            throw new NotFoundException("添付ファイルが見つかりません。");
        }

        // ファイルを読み込んで返す
        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
        var contentType = attachment.MimeType ?? "application/octet-stream";

        return TypedResults.File(
            fileContents: fileBytes,
            contentType: contentType,
            fileDownloadName: attachment.FileName
        );
    }
}