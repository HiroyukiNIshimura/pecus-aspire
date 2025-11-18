using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Extensions;
using Pecus.Libs;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/files")]
[Produces("application/json")]
[Tags("File")]
public class FileUploadController : BaseSecureController
{
    private readonly FileUploadService _fileUploadService;
    private readonly GenreService _genreService;
    private readonly UserService _userService;

    public FileUploadController(
        FileUploadService fileUploadService,
        GenreService genreService,
        UserService userService,
        ProfileService profileService,
        ILogger<FileUploadController> logger
    ) : base(profileService, logger)
    {
        _fileUploadService = fileUploadService;
        _genreService = genreService;
        _userService = userService;
    }

    /// <summary>
    /// ファイルをアップロード
    /// </summary>
    /// <param name="request">ファイルアップロードリクエスト</param>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<FileUploadResponse>> UploadFile([FromForm] FileUploadRequest request)
    {
        // CurrentUser は基底クラスで有効性チェック済み
        if (CurrentUser?.OrganizationId == null)
        {
            throw new InvalidOperationException("組織に所属していません。");
        }

        // ファイルの種類に応じたバリデーション
        if (request.FileType == FileType.Avatar)
        {
            // アバターの場合、リソースIDはユーザーIDであることを確認
            if (
                !await _fileUploadService.ValidateUserResourceAsync(
                    request.ResourceId,
                    CurrentUser.OrganizationId.Value
                )
            )
            {
                throw new InvalidOperationException("指定されたリソースへのアクセス権限がありません。");
            }
        }
        else if (request.FileType == FileType.Genre)
        {
            // ジャンルの場合、リソースIDはジャンルIDであることを確認
            if (!await _fileUploadService.ValidateGenreResourceAsync(request.ResourceId))
            {
                throw new InvalidOperationException("指定されたジャンルが見つかりません。");
            }
        }

        // ファイルをアップロード（WebP変換後のファイルパスが返される）
        var filePath = await _fileUploadService.UploadFileAsync(
            request.File,
            request.FileType.ToString().ToLowerInvariant(),
            request.ResourceId,
            CurrentUser.OrganizationId.Value
        );

        // アバターの場合、ユーザー情報を更新（WebP変換後のファイル名を保存）
        if (request.FileType == FileType.Avatar && request.ResourceId == CurrentUserId)
        {
            await UpdateUserAvatarAsync(CurrentUserId, filePath);
        }

        // ジャンルの場合、ジャンル情報を更新
        if (request.FileType == FileType.Genre)
        {
            await _genreService.UpdateGenreIconAsync(request.ResourceId, filePath, CurrentUserId);
        }

        var response = new FileUploadResponse
        {
            Success = true,
            FileUrl = $"/api/downloads/{request.FileType.GetDisplayName().ToLowerInvariant()}/{request.ResourceId}/{Path.GetFileName(filePath)}",
            FileSize = request.File.Length,
            ContentType = request.File.ContentType,
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
        // ファイル名を取得（UserAvatarPathにはファイル名のみを保存）
        var fileName = Path.GetFileName(filePath);

        // ユーザーのアバター情報をデータベースに更新
        // AvatarType は "UserAvatar" で固定
        await _userService.UpdateUserAvatarAsync(
            userId,
            avatarType: AvatarType.UserAvatar,
            userAvatarPath: fileName,
            updatedByUserId: CurrentUserId
        );
    }
}