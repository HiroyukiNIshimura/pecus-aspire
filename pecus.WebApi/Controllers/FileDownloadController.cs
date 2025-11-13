using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Extensions;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/downloads")]
[Produces("application/json")]
[Tags("File")]
public class FileDownloadController : BaseSecureController
{
    private readonly ILogger<FileDownloadController> _logger;

    public FileDownloadController(ProfileService profileService, ILogger<FileDownloadController> logger)
        : base(profileService, logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// アイコンファイルを取得（画像を返す）
    /// </summary>
    /// <param name="request">アイコン取得リクエスト</param>
    [HttpGet("icons")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<FileContentHttpResult> GetIcon([FromQuery] GetIconRequest request)
    {
        // CurrentUser は基底クラスで有効性チェック済み
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("ファイルが見つかりません。");
        }

        // 組織IDを使用してファイルパスを構築
        var uploadsPath = "uploads";
        var filePath = Path.Combine(
            uploadsPath,
            CurrentUser.OrganizationId.Value.ToString(),
            request.FileType.GetDisplayName().ToLowerInvariant(),
            request.ResourceId.ToString(),
            request.FileName
        );

        // UseOriginal が true の場合、元画像（_orgサフィックス付き）を取得
        if (request.UseOriginal)
        {
            filePath = ImageHelper.GenerateOriginalFilePath(filePath);
        }

        if (!System.IO.File.Exists(filePath))
        {
            throw new NotFoundException("ファイルが見つかりません。");
        }

        var contentType = GetContentType(request.FileName);
        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

        return TypedResults.File(fileBytes, contentType);
    }

    /// <summary>
    /// アイコンファイルを削除
    /// </summary>
    /// <param name="request">アイコン削除リクエスト</param>
    [HttpDelete("icons")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status404NotFound)]
    public Results<Ok<MessageResponse>, NotFound<MessageResponse>> DeleteIcon(
        [FromQuery] DeleteIconRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("ファイルが見つかりません。");
        }

        // 組織IDを使用してファイルパスを構築
        var uploadsPath = "uploads";
        var filePath = Path.Combine(
            uploadsPath,
            CurrentUser.OrganizationId.Value.ToString(),
            request.FileType.GetDisplayName().ToLowerInvariant(),
            request.ResourceId.ToString(),
            request.FileName
        );

        // リサイズ前の元画像ファイルパス（_orgサフィックス付き）も構築
        var originalFilePath = ImageHelper.GenerateOriginalFilePath(filePath);

        var deletedFiles = new List<string>();

        // リサイズ済みファイルを削除
        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
            deletedFiles.Add(filePath);
        }

        // 元画像（_orgサフィックス付き）を削除
        if (System.IO.File.Exists(originalFilePath))
        {
            System.IO.File.Delete(originalFilePath);
            deletedFiles.Add(originalFilePath);
        }

        if (deletedFiles.Count > 0)
        {
            _logger.LogInformation(
                "アイコンファイルを削除しました。OrganizationId: {OrganizationId}, FileType: {FileType}, ResourceId: {ResourceId}, FileName: {FileName}, DeletedFiles: {DeletedFiles}",
                CurrentUser.OrganizationId.Value,
                request.FileType,
                request.ResourceId,
                request.FileName,
                string.Join(", ", deletedFiles)
            );
        }
        else
        {
            _logger.LogInformation(
                "削除対象のファイルが既に存在しないため、削除をスキップしました。OrganizationId: {OrganizationId}, FileType: {FileType}, ResourceId: {ResourceId}, FileName: {FileName}",
                CurrentUser.OrganizationId.Value,
                request.FileType,
                request.ResourceId,
                request.FileName
            );
        }

        return TypedResults.Ok(new MessageResponse { Message = "ファイルを削除しました。" });
    }

    /// <summary>
    /// ファイル拡張子からContent-Typeを取得
    /// </summary>
    private string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream",
        };
    }
}
