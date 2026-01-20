using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Models.Requests.Agenda;
using Pecus.Models.Responses.Agenda;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// アジェンダコントローラー
/// </summary>
[Route("api/agendas")]
[Produces("application/json")]
[Tags("Agenda")]
public class AgendasController : BaseSecureController
{
    private readonly AgendaService _agendaService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly PecusConfig _config;

    public AgendasController(
        AgendaService agendaService,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService,
        ILogger<AgendasController> logger,
        PecusConfig config
    ) : base(profileService, logger)
    {
        _agendaService = agendaService;
        _accessHelper = accessHelper;
        _config = config;
    }

    /// <summary>
    /// アジェンダ一覧取得（期間指定）
    /// </summary>
    /// <remarks>
    /// 自分が参加者のアジェンダのみ返します。
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(List<AgendaResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<AgendaResponse>>> GetList(
        [FromQuery] DateTimeOffset startAt,
        [FromQuery] DateTimeOffset endAt
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.GetListAsync(CurrentOrganizationId, CurrentUserId, startAt, endAt);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 展開済みオカレンス一覧取得（期間指定）
    /// </summary>
    /// <remarks>
    /// 繰り返しイベントを展開し、各オカレンス（回）を個別に返します。
    /// 例外（特定回の中止・変更）も反映されます。
    /// 自分が参加者のアジェンダのみ返します。
    /// </remarks>
    [HttpGet("occurrences")]
    [ProducesResponseType(typeof(List<AgendaOccurrenceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<AgendaOccurrenceResponse>>> GetOccurrences(
        [FromQuery] DateTimeOffset startAt,
        [FromQuery] DateTimeOffset endAt
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.GetOccurrencesAsync(CurrentOrganizationId, CurrentUserId, startAt, endAt);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 直近のアジェンダ一覧取得
    /// </summary>
    /// <remarks>
    /// 自分が参加者のアジェンダのみ返します。
    /// </remarks>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(List<AgendaResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<AgendaResponse>>> GetRecentList(
        [FromQuery] int limit = 20
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.GetRecentListAsync(CurrentOrganizationId, CurrentUserId, limit);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 直近の展開済みオカレンス一覧取得
    /// </summary>
    /// <remarks>
    /// 繰り返しイベントを展開し、直近の各オカレンス（回）を個別に返します。
    /// タイムライン表示用に最適化されています。
    /// カーソルベースのページネーションに対応しています。
    /// </remarks>
    [HttpGet("occurrences/recent")]
    [ProducesResponseType(typeof(AgendaOccurrencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AgendaOccurrencesResponse>> GetRecentOccurrences(
        [FromQuery] GetRecentOccurrencesRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var pageSize = request.Limit ?? _config.Pagination.DefaultPageSize;
        var result = await _agendaService.GetRecentOccurrencesPaginatedAsync(CurrentOrganizationId, CurrentUserId, pageSize, request.Cursor);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// アジェンダ詳細取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AgendaResponse>> GetById(long id)
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.GetByIdAsync(id, CurrentOrganizationId);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// アジェンダ作成
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<AgendaResponse>> Create(
        [FromBody] CreateAgendaRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.CreateAsync(CurrentOrganizationId, CurrentUserId, request);
        return TypedResults.Created($"/api/agendas/{result.Id}", result);
    }

    /// <summary>
    /// アジェンダ更新（シリーズ全体）
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<AgendaResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AgendaResponse>> Update(
        long id,
        [FromBody] UpdateAgendaRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.UpdateAsync(id, CurrentOrganizationId, CurrentUserId, request);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 「この回以降」更新（シリーズ分割）
    /// </summary>
    /// <remarks>
    /// 指定された回を境にシリーズを分割します。
    /// 元のシリーズは分割地点の前の回で終了し、新しいシリーズが作成されます。
    /// 戻り値は新しく作成されたシリーズのアジェンダです。
    /// </remarks>
    [HttpPut("{id}/from")]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<AgendaResponse>> UpdateFromOccurrence(
        long id,
        [FromBody] UpdateFromOccurrenceRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.UpdateFromOccurrenceAsync(id, CurrentOrganizationId, CurrentUserId, request);
        return TypedResults.Created($"/api/agendas/{result.Id}", result);
    }

    /// <summary>
    /// アジェンダ中止（シリーズ全体）
    /// </summary>
    /// <remarks>
    /// 物理削除ではなく中止状態にします。中止されたアジェンダは一覧に表示されますが、
    /// 中止理由と共に視覚的に区別されます。
    /// </remarks>
    [HttpPatch("{id}/cancel")]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<AgendaResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AgendaResponse>> Cancel(
        long id,
        [FromBody] CancelAgendaRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.CancelAsync(id, CurrentOrganizationId, CurrentUserId, request);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 参加状況更新
    /// </summary>
    /// <remarks>
    /// 現在のユーザーの参加状況を更新します。
    /// </remarks>
    [HttpPatch("{id}/attendance")]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AgendaResponse>> UpdateAttendance(
        long id,
        [FromBody] UpdateAttendanceRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.UpdateAttendanceAsync(id, CurrentOrganizationId, CurrentUserId, request);
        return TypedResults.Ok(result);
    }

    // ===== 例外（特定回の中止・変更）エンドポイント =====

    /// <summary>
    /// アジェンダ例外一覧取得
    /// </summary>
    /// <remarks>
    /// 指定されたアジェンダの全例外（特定回の中止・変更）を取得します。
    /// </remarks>
    [HttpGet("{id}/exceptions")]
    [ProducesResponseType(typeof(List<AgendaExceptionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<AgendaExceptionResponse>>> GetExceptions(long id)
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.GetExceptionsAsync(id, CurrentOrganizationId);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// アジェンダ例外作成（特定回の中止・変更）
    /// </summary>
    /// <remarks>
    /// 繰り返しアジェンダの特定回を中止または変更します。
    /// 単発イベントには使用できません。シリーズ全体の変更は PUT を使用してください。
    /// </remarks>
    [HttpPost("{id}/exceptions")]
    [ProducesResponseType(typeof(AgendaExceptionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<AgendaExceptionResponse>> CreateException(
        long id,
        [FromBody] CreateAgendaExceptionRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.CreateExceptionAsync(id, CurrentOrganizationId, CurrentUserId, request);
        return TypedResults.Created($"/api/agendas/{id}/exceptions/{result.Id}", result);
    }

    /// <summary>
    /// アジェンダ例外更新
    /// </summary>
    /// <remarks>
    /// 既存の例外（特定回の中止・変更）を更新します。
    /// </remarks>
    [HttpPut("{id}/exceptions/{exceptionId}")]
    [ProducesResponseType(typeof(AgendaExceptionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AgendaExceptionResponse>> UpdateException(
        long id,
        long exceptionId,
        [FromBody] UpdateAgendaExceptionRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.UpdateExceptionAsync(id, exceptionId, CurrentOrganizationId, CurrentUserId, request);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// アジェンダ例外削除（元に戻す）
    /// </summary>
    /// <remarks>
    /// 例外を削除し、特定回を元の設定に戻します。
    /// 中止していた回の中止を取り消す、または変更していた回を元に戻す場合に使用します。
    /// </remarks>
    [HttpDelete("{id}/exceptions/{exceptionId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> DeleteException(long id, long exceptionId)
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        await _agendaService.DeleteExceptionAsync(id, exceptionId, CurrentOrganizationId);
        return TypedResults.NoContent();
    }
}
