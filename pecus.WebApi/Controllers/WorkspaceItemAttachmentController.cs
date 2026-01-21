using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models.Enums;
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
    /// <param name="request">アップロードリクエスト</param>
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
        IFormFile file,
        [FromForm] UploadAttachmentRequest request
    )
    {
        // ワークスペースへのアクセス権限と編集権限をチェック（Viewerは403）
        await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);

        if (file == null || file.Length == 0)
        {
            throw new InvalidOperationException("ファイルが指定されていません。");
        }

        // ファイル名とMIMEタイプを取得
        // originalFileNameが指定されていればそれを使用（表示用）、なければfile.FileNameを使用
        var displayFileName = !string.IsNullOrWhiteSpace(request.OriginalFileName)
            ? Path.GetFileName(request.OriginalFileName)
            : Path.GetFileName(file.FileName);
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

        // 物理ファイル名はfile.FileNameを使用（Next.jsでsafe名に変換済み）
        var physicalFileName = Path.GetFileName(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}_{physicalFileName}";
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
            displayFileName,
            file.Length,
            mimeType,
            filePath,
            downloadUrl,
            thumbnailMediumPath,
            thumbnailSmallPath,
            CurrentUserId,
            request.WorkspaceTaskId
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

        // Activity 記録（ファイル追加）
        var fileAddedDetails = ActivityDetailsBuilder.BuildFileAddedDetails(
            displayFileName,
            file.Length
        );
        _backgroundJobClient.Enqueue<ActivityTasks>(x =>
            x.RecordActivityAsync(
                workspaceId,
                itemId,
                CurrentUserId,
                ActivityActionType.FileAdded,
                fileAddedDetails
            )
        );

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
            UploadedBy = new UserIdentityResponse
            {
                Id = attachment.UploadedByUserId,
                Username = attachment.UploadedByUser?.Username,
                IdentityIconUrl = attachment.UploadedByUser != null
                        ? IdentityIconHelper.GetIdentityIconUrl(
                            iconType: attachment.UploadedByUser.AvatarType,
                            userId: attachment.UploadedByUser.Id,
                            username: attachment.UploadedByUser.Username,
                            email: attachment.UploadedByUser.Email,
                            avatarPath: attachment.UploadedByUser.UserAvatarPath
                        )
                        : null,
                IsActive = attachment.UploadedByUser?.IsActive ?? false,
            },
        };

        return TypedResults.Created(attachment.DownloadUrl, response);
    }

    /// <summary>
    /// ワークスペースアイテムの添付ファイル一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="taskId">ワークスペースタスクID（オプション）</param>
    /// <returns>添付ファイル一覧</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<WorkspaceItemAttachmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<WorkspaceItemAttachmentResponse>>> GetAttachments(
        int workspaceId,
        int itemId,
        int? taskId = null
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var attachments = await _attachmentService.GetAttachmentsAsync(workspaceId, itemId, taskId);

        var response = attachments
            .Select(static a => new WorkspaceItemAttachmentResponse
            {
                Id = a.Id,
                WorkspaceItemId = a.WorkspaceItemId,
                WorkspaceTaskId = a.WorkspaceTaskId,
                FileName = a.FileName,
                FileSize = a.FileSize,
                MimeType = a.MimeType,
                DownloadUrl = a.DownloadUrl,
                ThumbnailMediumUrl = a.ThumbnailMediumPath,
                ThumbnailSmallUrl = a.ThumbnailSmallPath,
                UploadedAt = a.UploadedAt,
                UploadedBy = new UserIdentityResponse
                {
                    Id = a.UploadedByUserId,
                    Username = a.UploadedByUser?.Username,
                    IdentityIconUrl = a.UploadedByUser != null
                            ? IdentityIconHelper.GetIdentityIconUrl(
                                iconType: a.UploadedByUser.AvatarType,
                                userId: a.UploadedByUser.Id,
                                username: a.UploadedByUser.Username,
                                email: a.UploadedByUser.Email,
                                avatarPath: a.UploadedByUser.UserAvatarPath
                            )
                            : null,
                    IsActive = a.UploadedByUser?.IsActive ?? false,
                },
                Task = a.WorkspaceTask != null
                    ? new WorkspaceItemAttachmentTask
                    {
                        SequenceNumber = a.WorkspaceTask.Sequence,
                        Content = a.WorkspaceTask.Content,
                        TaskTypeName = a.WorkspaceTask.TaskType?.Name ?? ""
                    } : null
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
        // ワークスペースへのアクセス権限と編集権限をチェック（Viewerは403）
        await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);

        var attachment = await _attachmentService.DeleteAttachmentAsync(
            workspaceId,
            itemId,
            attachmentId,
            CurrentUserId
        );

        // Activity 記録（ファイル削除）
        var fileRemovedDetails = ActivityDetailsBuilder.BuildFileRemovedDetails(attachment.FileName);
        _backgroundJobClient.Enqueue<ActivityTasks>(x =>
            x.RecordActivityAsync(
                workspaceId,
                itemId,
                CurrentUserId,
                ActivityActionType.FileRemoved,
                fileRemovedDetails
            )
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

