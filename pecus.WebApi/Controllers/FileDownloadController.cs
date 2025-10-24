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
    /// <param name="fileType">ファイルの種類</param>
    /// <param name="resourceId">リソースID</param>
    /// <param name="fileName">ファイル名</param>
    [HttpGet("{fileType}/{resourceId}/{fileName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIcon(string fileType, int resourceId, string fileName)
    {
        try
        {
            // ファイルタイプの検証
            if (!FileUploadHelper.IsValidFileType(fileType))
            {
                return NotFound();
            }

            // ログインユーザーの組織IDを取得
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var user = await _userService.GetUserByIdAsync(userId);

            if (user?.OrganizationId == null)
            {
                return NotFound();
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
                return NotFound();
            }

            var contentType = GetContentType(fileName);
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

            return File(fileBytes, contentType);
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
            return NotFound();
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
