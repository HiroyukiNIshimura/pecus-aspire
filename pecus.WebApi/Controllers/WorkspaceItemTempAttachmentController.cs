using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Models.Responses;
using Pecus.Models.Responses.WorkspaceItem;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// ワークスペースアイテム作成前の一時添付ファイル管理
/// </summary>
[ApiController]
[Route("api/workspaces/{workspaceId}/temp-attachments")]
[Authorize]
public class WorkspaceItemTempAttachmentController : ControllerBase
{
    private readonly WorkspaceItemTempAttachmentService _tempAttachmentService;
    private readonly OrganizationAccessHelper _accessHelper;

    public WorkspaceItemTempAttachmentController(
        WorkspaceItemTempAttachmentService tempAttachmentService,
        OrganizationAccessHelper accessHelper)
    {
        _tempAttachmentService = tempAttachmentService;
        _accessHelper = accessHelper;
    }

    private int CurrentUserId => JwtBearerUtil.GetUserIdFromPrincipal(User);

    /// <summary>
    /// 一時添付ファイルをアップロード（アイテム作成前用）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="sessionId">セッション識別子（フロントで生成したUUID等）</param>
    /// <param name="file">アップロードするファイル</param>
    /// <returns>一時ファイル情報</returns>
    [HttpPost("{sessionId}")]
    [ProducesResponseType(typeof(TempAttachmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Created<TempAttachmentResponse>> UploadTempAttachment(
        [FromRoute] int workspaceId,
        [FromRoute] string sessionId,
        IFormFile file)
    {
        // ワークスペースへのアクセス権確認
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new Pecus.Exceptions.NotFoundException("ワークスペースが見つかりません。");
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

        var result = await _tempAttachmentService.UploadTempFileAsync(
            workspaceId: workspaceId,
            sessionId: sessionId,
            file: file,
            uploadedByUserId: CurrentUserId);

        return TypedResults.Created(
            $"/api/workspaces/{workspaceId}/temp-attachments/{sessionId}/{result.TempFileId}",
            result);
    }

    /// <summary>
    /// 一時添付ファイルを取得（プレビュー用）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="sessionId">セッション識別子</param>
    /// <param name="fileName">ファイル名</param>
    /// <returns>ファイルデータ</returns>
    [HttpGet("{sessionId}/{fileName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IResult> GetTempAttachment(
        [FromRoute] int workspaceId,
        [FromRoute] string sessionId,
        [FromRoute] string fileName)
    {
        // ワークスペースへのアクセス権確認
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new Pecus.Exceptions.NotFoundException("ワークスペースが見つかりません。");
        }

        var filePath = _tempAttachmentService.GetTempFilePath(
            workspaceId: workspaceId,
            sessionId: sessionId,
            fileName: fileName);

        if (filePath == null)
        {
            return TypedResults.NotFound(new ErrorResponse
            {
                Message = "ファイルが見つかりません。"
            });
        }

        var mimeType = GetMimeType(fileName);
        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return TypedResults.File(fileBytes, mimeType);
    }

    /// <summary>
    /// セッションの一時ファイルをすべて削除
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="sessionId">セッション識別子</param>
    /// <returns>削除結果</returns>
    [HttpDelete("{sessionId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<NoContent> DeleteTempAttachments(
        [FromRoute] int workspaceId,
        [FromRoute] string sessionId)
    {
        // ワークスペースへのアクセス権確認
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new Pecus.Exceptions.NotFoundException("ワークスペースが見つかりません。");
        }

        _tempAttachmentService.CleanupSessionFiles(
            workspaceId: workspaceId,
            sessionId: sessionId);

        return TypedResults.NoContent();
    }

    private static string GetMimeType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            _ => "application/octet-stream"
        };
    }
}