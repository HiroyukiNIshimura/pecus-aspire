using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Controllers.Backend;
using Pecus.Models.Requests.BackOffice;
using Pecus.Models.Responses.BackOffice;
using Pecus.Models.Responses.Common;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// バックオフィス用コントローラー（システム通知管理）
/// </summary>
[ApiController]
[Route("api/backoffice/notifications")]
[Produces("application/json")]
[Tags("BackOffice - Notifications")]
public class BackOfficeNotificationController : BaseBackendController
{
    private readonly SystemNotificationService _systemNotificationService;
    private readonly ILogger<BackOfficeNotificationController> _logger;

    public BackOfficeNotificationController(
        ProfileService profileService,
        SystemNotificationService systemNotificationService,
        ILogger<BackOfficeNotificationController> logger
    ) : base(
        profileService: profileService,
        logger: logger
    )
    {
        _systemNotificationService = systemNotificationService;
        _logger = logger;
    }

    /// <summary>
    /// システム通知一覧を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<BackOfficeNotificationListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Ok<PagedResponse<BackOfficeNotificationListItemResponse>>> GetNotifications(
        [FromQuery] BackOfficeGetNotificationsRequest request)
    {
        var response = await _systemNotificationService.GetNotificationsAsync(request);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// システム通知詳細を取得
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(BackOfficeNotificationDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Ok<BackOfficeNotificationDetailResponse>> GetNotification(int id)
    {
        var response = await _systemNotificationService.GetNotificationAsync(id);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// システム通知を作成
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(BackOfficeNotificationDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Created<BackOfficeNotificationDetailResponse>> CreateNotification(
        [FromBody] BackOfficeCreateNotificationRequest request)
    {
        var response = await _systemNotificationService.CreateNotificationAsync(request, CurrentUserId);
        return TypedResults.Created($"/api/backoffice/notifications/{response.Id}", response);
    }

    /// <summary>
    /// システム通知を更新（公開前のみ）
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(BackOfficeNotificationDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Ok<BackOfficeNotificationDetailResponse>> UpdateNotification(
        int id,
        [FromBody] BackOfficeUpdateNotificationRequest request)
    {
        var response = await _systemNotificationService.UpdateNotificationAsync(
            id,
            request,
            CurrentUserId);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// システム通知を削除
    /// </summary>
    /// <remarks>
    /// 論理削除を行います。配信済みのメッセージも削除するかどうかを指定できます。
    /// </remarks>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<NoContent> DeleteNotification(
        int id,
        [FromBody] BackOfficeDeleteNotificationRequest request)
    {
        await _systemNotificationService.DeleteNotificationAsync(id, request);
        return TypedResults.NoContent();
    }
}
