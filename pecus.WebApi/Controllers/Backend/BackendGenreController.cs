using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Genre;
using Pecus.Services;

namespace Pecus.Controllers.Backend;

/// <summary>
/// ジャンルコントローラー（バックエンド管理用）
/// </summary>
[Route("api/backend/genres")]
[Tags("Backend - Genre")]
public class BackendGenreController : BaseBackendController
{
    private readonly GenreService _genreService;
    private readonly PecusConfig _config;

    public BackendGenreController(
        GenreService genreService,
        PecusConfig config,
        ProfileService profileService,
        ILogger<BackendGenreController> logger
    )
        : base(profileService, logger)
    {
        _genreService = genreService;
        _config = config;
    }

    /// <summary>
    /// ジャンル一覧を取得
    /// </summary>
    /// <param name="request">ジャンル一覧取得リクエスト</param>
    /// <returns>ジャンル一覧</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<GenreListItemResponse>), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<Ok<PagedResponse<GenreListItemResponse>>> GetGenres([FromQuery] GetGenresRequest request)
    {
        var currentPage = request.Page ?? 1;
        (List<GenreListItemResponse> genres, int totalCount) = await _genreService.GetGenresPagedAsync(
            currentPage,
            request.ActiveOnly
        );

        var response = PaginationHelper.CreatePagedResponse(
            data: genres,
            totalCount: totalCount,
            page: currentPage,
            pageSize: _config.Pagination.DefaultPageSize
        );

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ジャンル詳細を取得
    /// </summary>
    /// <param name="id">ジャンルID</param>
    /// <returns>ジャンル詳細</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(GenreResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<Ok<GenreResponse>> GetGenreById(int id)
    {
        var genre = await _genreService.GetGenreByIdAsync(id);
        return TypedResults.Ok(genre);
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
    public async Task<Ok<GenreResponse>> CreateGenre([FromBody] CreateGenreRequest request)
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
        var genre = await _genreService.CreateGenreAsync(request, me);
        return TypedResults.Ok(genre);
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
    public async Task<Ok<GenreResponse>> UpdateGenre(int id, [FromBody] UpdateGenreRequest request)
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
        var genre = await _genreService.UpdateGenreAsync(id, request, me);
        return TypedResults.Ok(genre);
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
    public async Task<Ok<SuccessResponse>> DeleteGenre(int id)
    {
        await _genreService.DeleteGenreAsync(id);
        return TypedResults.Ok(
            new SuccessResponse { StatusCode = 200, Message = "ジャンルを削除しました。" }
        );
    }

    /// <summary>
    /// ジャンルのアクティブ状態を設定
    /// </summary>
    /// <param name="id">ジャンルID</param>
    /// <param name="request">アクティブ状態設定リクエスト</param>
    /// <returns>設定結果</returns>
    [HttpPut("{id}/active-status")]
    [ProducesResponseType(typeof(SuccessResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<Ok<SuccessResponse>> SetGenreActiveStatus(int id, [FromBody] SetActiveStatusRequest request)
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
        await _genreService.SetGenreActiveStatusAsync(id, request.IsActive, me);
        var message = request.IsActive
            ? "ジャンルを有効化しました。"
            : "ジャンルを無効化しました。";
        return TypedResults.Ok(new SuccessResponse { StatusCode = 200, Message = message });
    }
}
