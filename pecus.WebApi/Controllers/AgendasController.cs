using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
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

    public AgendasController(
        AgendaService agendaService,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService,
        ILogger<AgendasController> logger
    ) : base(profileService, logger)
    {
        _agendaService = agendaService;
        _accessHelper = accessHelper;
    }

    /// <summary>
    /// アジェンダ一覧取得（期間指定）
    /// </summary>
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

        var result = await _agendaService.GetListAsync(CurrentOrganizationId, startAt, endAt);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 展開済みオカレンス一覧取得（期間指定）
    /// </summary>
    /// <remarks>
    /// 繰り返しイベントを展開し、各オカレンス（回）を個別に返します。
    /// 例外（特定回の中止・変更）も反映されます。
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

        var result = await _agendaService.GetRecentListAsync(CurrentOrganizationId, limit);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 直近の展開済みオカレンス一覧取得
    /// </summary>
    /// <remarks>
    /// 繰り返しイベントを展開し、直近の各オカレンス（回）を個別に返します。
    /// タイムライン表示用に最適化されています。
    /// </remarks>
    [HttpGet("occurrences/recent")]
    [ProducesResponseType(typeof(List<AgendaOccurrenceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<AgendaOccurrenceResponse>>> GetRecentOccurrences(
        [FromQuery] int limit = 20
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.GetRecentOccurrencesAsync(CurrentOrganizationId, CurrentUserId, limit);
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

        var result = await _agendaService.UpdateAsync(id, CurrentOrganizationId, request);
        return TypedResults.Ok(result);
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
}
