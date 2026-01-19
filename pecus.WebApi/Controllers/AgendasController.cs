using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.Security;
using Pecus.Models.Requests.Agenda;
using Pecus.Models.Responses.Agenda;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/organizations/{organizationId}/agendas")]
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
    public async Task<Ok<List<AgendaResponse>>> GetList(
        int organizationId,
        [FromQuery] int? workspaceId,
        [FromQuery] DateTimeOffset startAt,
        [FromQuery] DateTimeOffset endAt
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, organizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.GetListAsync(organizationId, workspaceId, startAt, endAt);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 直近のアジェンダ一覧取得
    /// </summary>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(List<AgendaResponse>), StatusCodes.Status200OK)]
    public async Task<Ok<List<AgendaResponse>>> GetRecentList(
        int organizationId,
        [FromQuery] int? workspaceId,
        [FromQuery] int limit = 20
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, organizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.GetRecentListAsync(organizationId, workspaceId, limit);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// アジェンダ詳細取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status200OK)]
    public async Task<Ok<AgendaResponse>> GetById(int organizationId, long id)
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, organizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.GetByIdAsync(id, organizationId);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// アジェンダ作成
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status201Created)]
    public async Task<Created<AgendaResponse>> Create(
        int organizationId,
        [FromBody] CreateAgendaRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, organizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.CreateAsync(organizationId, request.WorkspaceId, CurrentUserId, request);
        return TypedResults.Created($"/api/organizations/{organizationId}/agendas/{result.Id}", result);
    }

    /// <summary>
    /// アジェンダ更新
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AgendaResponse), StatusCodes.Status200OK)]
    public async Task<Ok<AgendaResponse>> Update(
        int organizationId,
        long id,
        [FromQuery] int? workspaceId,
        [FromBody] UpdateAgendaRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, organizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _agendaService.UpdateAsync(id, organizationId, workspaceId, CurrentUserId, request);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// アジェンダ削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<NoContent> Delete(
        int organizationId,
        long id,
        [FromQuery] int? workspaceId
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, organizationId))
            throw new NotFoundException("組織が見つかりません。");

        await _agendaService.DeleteAsync(id, organizationId, workspaceId);
        return TypedResults.NoContent();
    }
}
