using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests.Agenda;
using Pecus.Models.Responses.Agenda;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// アジェンダ通知コントローラー
/// </summary>
[Route("api/agendas/notifications")]
[Produces("application/json")]
[Tags("AgendaNotification")]
public class AgendaNotificationsController : BaseSecureController
{
    private readonly AgendaNotificationService _notificationService;
    private readonly OrganizationAccessHelper _accessHelper;

    public AgendaNotificationsController(
        AgendaNotificationService notificationService,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService,
        ILogger<AgendaNotificationsController> logger
    ) : base(profileService, logger)
    {
        _notificationService = notificationService;
        _accessHelper = accessHelper;
    }

    /// <summary>
    /// 通知一覧取得
    /// </summary>
    /// <param name="limit">取得件数（デフォルト: 50）</param>
    /// <param name="beforeId">このID以前の通知を取得（ページング用）</param>
    /// <param name="unreadOnly">未読のみ取得</param>
    [HttpGet]
    [ProducesResponseType(typeof(List<AgendaNotificationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<AgendaNotificationResponse>>> GetList(
        [FromQuery] int limit = 50,
        [FromQuery] long? beforeId = null,
        [FromQuery] bool unreadOnly = false
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _notificationService.GetListAsync(
            CurrentOrganizationId, CurrentUserId, limit, beforeId, unreadOnly);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 未読通知件数取得（ヘッダーバッジ用）
    /// </summary>
    [HttpGet("count")]
    [ProducesResponseType(typeof(AgendaNotificationCountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AgendaNotificationCountResponse>> GetCount()
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var result = await _notificationService.GetCountAsync(CurrentOrganizationId, CurrentUserId);
        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 通知を既読にする（個別）
    /// </summary>
    [HttpPost("{id}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> MarkAsRead(long id)
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        await _notificationService.MarkAsReadAsync(CurrentOrganizationId, CurrentUserId, id);
        return TypedResults.NoContent();
    }

    /// <summary>
    /// 通知を一括既読にする
    /// </summary>
    /// <remarks>
    /// notificationIdsを指定した場合は指定した通知のみ、
    /// 指定しない場合は全ての未読通知を既読にします。
    /// </remarks>
    [HttpPost("read")]
    [ProducesResponseType(typeof(MarkNotificationsReadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<MarkNotificationsReadResponse>> MarkMultipleAsRead(
        [FromBody] MarkNotificationsReadRequest request
    )
    {
        if (!await _accessHelper.CanAccessOrganizationAsync(CurrentUserId, CurrentOrganizationId))
            throw new NotFoundException("組織が見つかりません。");

        var count = await _notificationService.MarkMultipleAsReadAsync(
            CurrentOrganizationId, CurrentUserId, request.NotificationIds);

        return TypedResults.Ok(new MarkNotificationsReadResponse { MarkedCount = count });
    }
}

/// <summary>
/// 一括既読レスポンス
/// </summary>
public class MarkNotificationsReadResponse
{
    /// <summary>
    /// 既読にした通知数
    /// </summary>
    public int MarkedCount { get; set; }
}
