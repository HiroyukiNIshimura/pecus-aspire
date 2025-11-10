using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Models.Responses.Common;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/files")]
[Produces("application/json")]
public class FileUploadController : BaseSecureController
{
    private readonly FileUploadService _fileUploadService;
    private readonly GenreService _genreService;
    private readonly ILogger<FileUploadController> _logger;

    public FileUploadController(
        FileUploadService fileUploadService,
        GenreService genreService,
        ProfileService profileService,
        ILogger<FileUploadController> logger
    ) : base(profileService, logger)
    {
        _fileUploadService = fileUploadService;
        _genreService = genreService;
        _logger = logger;
    }

    /// <summary>
    /// ファイルをアップロード
    /// </summary>
    /// <param name="fileType">ファイルの種類（avatar, genre）</param>
    /// <param name="resourceId">リソースID</param>
    /// <param name="file">アップロードするファイル</param>
    [HttpPost("{fileType}/{resourceId}")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<FileUploadResponse>> UploadFile(
        string fileType,
        int resourceId,
        IFormFile file
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        if (CurrentUser?.OrganizationId == null)
        {
            throw new InvalidOperationException("組織に所属していません。");
        }

        // ファイルの種類に応じたバリデーション
        if (fileType.ToLowerInvariant() == "avatar")
        {
            // アバターの場合、リソースIDはユーザーIDであることを確認
            if (
                !await _fileUploadService.ValidateUserResourceAsync(
                    resourceId,
                    CurrentUser.OrganizationId.Value
                )
            )
            {
                throw new InvalidOperationException("指定されたリソースへのアクセス権限がありません。");
            }
        }
        else if (fileType.ToLowerInvariant() == "genre")
        {
            // ジャンルの場合、リソースIDはジャンルIDであることを確認
            if (!await _fileUploadService.ValidateGenreResourceAsync(resourceId))
            {
                throw new InvalidOperationException("指定されたジャンルが見つかりません。");
            }
        }

        // ファイルをアップロード
        var filePath = await _fileUploadService.UploadFileAsync(
            file,
            fileType,
            resourceId,
            CurrentUser.OrganizationId.Value
        );

        // アバターの場合、ユーザー情報を更新
        if (fileType.ToLowerInvariant() == "avatar" && resourceId == CurrentUserId)
        {
            await UpdateUserAvatarAsync(CurrentUserId, filePath);
        }

        // ジャンルの場合、ジャンル情報を更新
        if (fileType.ToLowerInvariant() == "genre")
        {
            await UpdateGenreIconAsync(resourceId, filePath, CurrentUserId);
        }

        var response = new FileUploadResponse
        {
            Success = true,
            FileUrl = $"/api/downloads/{fileType}/{resourceId}/{Path.GetFileName(filePath)}",
            FileSize = file.Length,
            ContentType = file.ContentType,
            UploadedAt = DateTime.UtcNow,
            Message = "ファイルのアップロードに成功しました。",
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ユーザーのアバター情報を更新
    /// </summary>
    private async Task UpdateUserAvatarAsync(int userId, string filePath)
    {
        // FileDownloadController.GetIconメソッドのURLパターンに合わせてAvatarUrlを設定
        var fileName = Path.GetFileName(filePath);
        var avatarUrl = $"/api/downloads/avatar/{userId}/{fileName}";

        // ProfileService でアバター情報を更新
        // (ProfileService に UpdateUserAvatarAsync メソッドがない場合は、別の手段を検討)
    }

    /// <summary>
    /// ジャンルのアイコン情報を更新
    /// </summary>
    private async Task UpdateGenreIconAsync(int genreId, string filePath, int updatedByUserId) =>
        await _genreService.UpdateGenreIconAsync(genreId, filePath, updatedByUserId);
}
