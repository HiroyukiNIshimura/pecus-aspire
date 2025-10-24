using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Genre;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// ジャンルコントローラー
/// </summary>
[ApiController]
[Route("api/genres")]
public class GenreController : ControllerBase
{
    private readonly GenreService _genreService;
    private readonly PecusConfig _config;
    private readonly ILogger<GenreController> _logger;

    public GenreController(
        GenreService genreService,
        PecusConfig config,
        ILogger<GenreController> logger
    )
    {
        _genreService = genreService;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// ジャンル一覧を取得
    /// </summary>
    /// <param name="page">ページ番号（1から開始）</param>
    /// <param name="activeOnly">有効なジャンルのみを取得するか</param>
    /// <returns>ジャンル一覧</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<GenreListItemResponse>), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<
        Results<
            Ok<PagedResponse<GenreListItemResponse>>,
            BadRequest<ErrorResponse>,
            StatusCodeHttpResult
        >
    > GetGenres([FromQuery] int? page, [FromQuery] bool? activeOnly)
    {
        try
        {
            var currentPage = page ?? 1;
            var (genres, totalCount) = await _genreService.GetGenresPagedAsync(
                currentPage,
                activeOnly
            );

            var response = PaginationHelper.CreatePagedResponse(
                genres,
                currentPage,
                _config.Pagination.DefaultPageSize,
                totalCount
            );

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ジャンル一覧の取得中にエラーが発生しました。");
            return TypedResults.StatusCode(500);
        }
    }

    /// <summary>
    /// ジャンル詳細を取得
    /// </summary>
    /// <param name="id">ジャンルID</param>
    /// <returns>ジャンル詳細</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(GenreDetailResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<
        Results<Ok<GenreDetailResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetGenreById(int id)
    {
        try
        {
            var genre = await _genreService.GetGenreByIdAsync(id);
            return TypedResults.Ok(genre);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse { StatusCode = 404, Message = ex.Message }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ジャンル詳細の取得中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(500);
        }
    }

    /// <summary>
    /// ジャンルを作成
    /// </summary>
    /// <param name="request">ジャンル作成リクエスト</param>
    /// <returns>作成されたジャンル</returns>
    [HttpPost]
    [ProducesResponseType(typeof(GenreResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<
        Results<Ok<GenreResponse>, BadRequest<ErrorResponse>, StatusCodeHttpResult>
    > CreateGenre([FromBody] CreateGenreRequest request)
    {
        try
        {
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var genre = await _genreService.CreateGenreAsync(request, userId);
            return TypedResults.Ok(genre);
        }
        catch (DuplicateException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse { StatusCode = 400, Message = ex.Message }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ジャンルの作成中にエラーが発生しました。");
            return TypedResults.StatusCode(500);
        }
    }

    /// <summary>
    /// ジャンルを更新
    /// </summary>
    /// <param name="id">ジャンルID</param>
    /// <param name="request">ジャンル更新リクエスト</param>
    /// <returns>更新されたジャンル</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(GenreResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<
        Results<
            Ok<GenreResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UpdateGenre(int id, [FromBody] UpdateGenreRequest request)
    {
        try
        {
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var genre = await _genreService.UpdateGenreAsync(id, request, userId);
            return TypedResults.Ok(genre);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse { StatusCode = 404, Message = ex.Message }
            );
        }
        catch (DuplicateException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse { StatusCode = 400, Message = ex.Message }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ジャンルの更新中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(500);
        }
    }

    /// <summary>
    /// ジャンルを削除
    /// </summary>
    /// <param name="id">ジャンルID</param>
    /// <returns>削除結果</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<
        Results<
            Ok<SuccessResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > DeleteGenre(int id)
    {
        try
        {
            await _genreService.DeleteGenreAsync(id);
            return TypedResults.Ok(
                new SuccessResponse { StatusCode = 200, Message = "ジャンルを削除しました。" }
            );
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse { StatusCode = 404, Message = ex.Message }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse { StatusCode = 400, Message = ex.Message }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ジャンルの削除中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(500);
        }
    }

    /// <summary>
    /// ジャンルを有効化
    /// </summary>
    /// <param name="id">ジャンルID</param>
    /// <returns>有効化結果</returns>
    [HttpPatch("{id}/activate")]
    [ProducesResponseType(typeof(SuccessResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<
        Results<
            Ok<SuccessResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > ActivateGenre(int id)
    {
        try
        {
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            await _genreService.ActivateGenreAsync(id, userId);
            return TypedResults.Ok(
                new SuccessResponse { StatusCode = 200, Message = "ジャンルを有効化しました。" }
            );
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse { StatusCode = 404, Message = ex.Message }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse { StatusCode = 400, Message = ex.Message }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ジャンルの有効化中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(500);
        }
    }

    /// <summary>
    /// ジャンルを無効化
    /// </summary>
    /// <param name="id">ジャンルID</param>
    /// <returns>無効化結果</returns>
    [HttpPatch("{id}/deactivate")]
    [ProducesResponseType(typeof(SuccessResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<
        Results<
            Ok<SuccessResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > DeactivateGenre(int id)
    {
        try
        {
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            await _genreService.DeactivateGenreAsync(id, userId);
            return TypedResults.Ok(
                new SuccessResponse { StatusCode = 200, Message = "ジャンルを無効化しました。" }
            );
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse { StatusCode = 404, Message = ex.Message }
            );
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse { StatusCode = 400, Message = ex.Message }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ジャンルの無効化中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(500);
        }
    }
}
