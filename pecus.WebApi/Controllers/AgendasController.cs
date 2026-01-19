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
        return TypedResults.Created($"/api/organizations/{CurrentOrganizationId}/agendas/{result.Id}", result);
    }

    /// <summary>
    /// アジェンダ更新
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<AgendaResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AgendaResponse>> Update(
        int organizationId,
        long id,
        [FromBody] UpdateAgendaRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, organizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.UpdateAsync(id, organizationId, request);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// アジェンダ削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> Delete(
        long id
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        await _agendaService.DeleteAsync(id, CurrentOrganizationId);
        return TypedResults.NoContent();
    }
}
