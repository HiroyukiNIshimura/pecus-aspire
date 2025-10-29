using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Services;

namespace Pecus.Controllers;

[ApiController]
[Route("api/downloads")]
[Produces("application/json")]
public class FileDownloadController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ILogger<FileDownloadController> _logger;

    public FileDownloadController(UserService userService, ILogger<FileDownloadController> logger)
    {
        _userService = userService;
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
    public async Task<
        Results<FileContentHttpResult, NotFound>
    > GetIcon(string fileType, int resourceId, string fileName)
    {
        try
        {
            // ファイルタイプの検証
            if (!FileUploadHelper.IsValidFileType(fileType))
            {
                return TypedResults.NotFound();
            }

            // ログインユーザーの組織IDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var user = await _userService.GetUserByIdAsync(me);

            if (user?.OrganizationId == null)
            {
                return TypedResults.NotFound();
            }

            // 組織IDを使用してファイルパスを構築
            var uploadsPath = "uploads";
            var filePath = Path.Combine(
                uploadsPath,
                user.OrganizationId.Value.ToString(),
                fileType,
                resourceId.ToString(),
                fileName
            );

            if (!System.IO.File.Exists(filePath))
            {
                return TypedResults.NotFound();
            }

            var contentType = GetContentType(fileName);
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

            return TypedResults.File(fileBytes, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "アイコン取得中にエラーが発生しました。FileType: {FileType}, ResourceId: {ResourceId}, FileName: {FileName}",
                fileType,
                resourceId,
                fileName
            );
            return TypedResults.NotFound();
        }
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
