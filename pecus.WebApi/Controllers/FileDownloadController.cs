using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Extensions;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/downloads")]
[Produces("application/json")]
[ApiExplorerSettings(GroupName = "File")]
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
    [HttpGet("{fileType}/{resourceId}/{fileName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<FileContentHttpResult> GetIcon([FromRoute] GetIconRequest request)
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

        if (!System.IO.File.Exists(filePath))
        {
            throw new NotFoundException("ファイルが見つかりません。");
        }

        var contentType = GetContentType(request.FileName);
        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

        return TypedResults.File(fileBytes, contentType);
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
