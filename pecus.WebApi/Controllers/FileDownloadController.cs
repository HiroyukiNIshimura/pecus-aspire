using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/downloads")]
[Produces("application/json")]
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
    /// <param name="fileType">ファイルの種類（avatar, genre）</param>
    /// <param name="resourceId">リソースID</param>
    /// <param name="fileName">ファイル名</param>
    [HttpGet("{fileType}/{resourceId}/{fileName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<FileContentHttpResult> GetIcon(string fileType, int resourceId, string fileName)
    {
        // ファイルタイプの検証
        if (!FileUploadHelper.IsValidFileType(fileType))
        {
            throw new NotFoundException("ファイルが見つかりません。");
        }

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
            fileType,
            resourceId.ToString(),
            fileName
        );

        if (!System.IO.File.Exists(filePath))
        {
            throw new NotFoundException("ファイルが見つかりません。");
        }

        var contentType = GetContentType(fileName);
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
