using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests.File;
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
    /// ファイルを取得（ルートベース）
    /// </summary>
    /// <param name="request">ファイル種別/リソースID/ファイル名/元画像フラグを含むリクエストDTO</param>
    /// <param name="useOriginal">元画像（リサイズ前）を取得するかどうか（クエリパラメータ）</param>
    [HttpGet("{FileType}/{ResourceId}/{FileName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<FileContentHttpResult> GetFile(
        [FromRoute] FileDownloadRequest request,
        bool useOriginal)
    {
        // 組織IDを使用してファイルパスを構築
        var uploadsPath = "uploads";
        var filePath = Path.Combine(
            uploadsPath,
            CurrentOrganizationId.ToString(),
            request.FileType.ToString().ToLowerInvariant(),
            request.ResourceId.ToString(),
            request.FileName
        );

        // UseOriginal が true の場合、元画像（_orgサフィックス付き）を取得
        if (useOriginal)
        {
            filePath = GetOriginalFilePath(filePath, request.FileName);
        }

        // ファイルが見つからない場合、フォールバックを試行
        if (!System.IO.File.Exists(filePath))
        {
            // 1. WebP拡張子に変換して試行（リサイズ後のファイル）
            var webpFilePath = Path.Combine(
                Path.GetDirectoryName(filePath) ?? string.Empty,
                Path.GetFileNameWithoutExtension(filePath) + ".webp"
            );
            if (System.IO.File.Exists(webpFilePath))
            {
                filePath = webpFilePath;
            }
            else
            {
                // 2. _org サフィックス付きファイルにフォールバック（元画像）
                var originalFilePath = GetOriginalFilePath(filePath, request.FileName);
                if (System.IO.File.Exists(originalFilePath))
                {
                    filePath = originalFilePath;
                }
                else
                {
                    throw new NotFoundException("ファイルが見つかりません。");
                }
            }
        }

        var contentType = GetContentType(Path.GetFileName(filePath));
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
        // 組織IDを使用してファイルパスを構築
        var uploadsPath = "uploads";
        var filePath = Path.Combine(
            uploadsPath,
            CurrentOrganizationId.ToString(),
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
            _logger.LogDebug(
                "アイコンファイルを削除しました。OrganizationId: {OrganizationId}, FileType: {FileType}, ResourceId: {ResourceId}, FileName: {FileName}, DeletedFiles: {DeletedFiles}",
                CurrentOrganizationId,
                request.FileType,
                request.ResourceId,
                request.FileName,
                string.Join(", ", deletedFiles)
            );
        }
        else
        {
            _logger.LogDebug(
                "削除対象のファイルが既に存在しないため、削除をスキップしました。OrganizationId: {OrganizationId}, FileType: {FileType}, ResourceId: {ResourceId}, FileName: {FileName}",
                CurrentOrganizationId,
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

    /// <summary>
    /// 元画像（リサイズ前）のファイルパスを取得
    /// </summary>
    /// <param name="filePath">現在のファイルパス</param>
    /// <param name="fileName">ファイル名</param>
    /// <returns>元画像のファイルパス（見つからない場合は元のパス）</returns>
    private string GetOriginalFilePath(string filePath, string fileName)
    {
        // WebP変換前の元ファイル名を推測
        // 例: filename.webp → filename_org.jpg, filename_org.png など
        var directory = Path.GetDirectoryName(filePath);
        var fileNameWithoutExt = Path.GetFileNameWithoutExtension(fileName);

        // 元画像の拡張子候補（.webpを除く画像形式）
        var possibleExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };

        foreach (var ext in possibleExtensions)
        {
            var candidatePath = Path.Combine(directory ?? string.Empty, $"{fileNameWithoutExt}_org{ext}");
            if (System.IO.File.Exists(candidatePath))
            {
                return candidatePath;
            }
        }

        // 元画像が見つからない場合は通常のファイルにフォールバック
        _logger.LogWarning(
            "元画像が見つかりません。リサイズ済み画像を返します。FileName: {FileName}",
            fileName
        );

        return filePath;
    }
}