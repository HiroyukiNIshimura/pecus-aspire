using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Pecus.Hubs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Services;

/// <summary>
/// システム通知送信ヘルパーサービス。
/// 組織のシステムルームへのメッセージ送信と、リアルタイム通知（SignalR）を一括で行う。
/// </summary>
public class SystemNotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ChatRoomService _chatRoomService;
    private readonly ChatMessageService _chatMessageService;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<SystemNotificationService> _logger;

    /// <summary>
    /// システムユーザーID（システム通知ルーム作成時の作成者として使用）
    /// </summary>
    private const int SystemUserId = 1;

    public SystemNotificationService(
        ApplicationDbContext context,
        ChatRoomService chatRoomService,
        ChatMessageService chatMessageService,
        IHubContext<NotificationHub> hubContext,
        ILogger<SystemNotificationService> logger
    )
    {
        _context = context;
        _chatRoomService = chatRoomService;
        _chatMessageService = chatMessageService;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// 組織のシステムルームにメッセージを送信し、組織グループに SignalR で通知する。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="content">メッセージ内容</param>
    /// <returns>作成されたメッセージ</returns>
    public async Task<ChatMessage> SendAsync(int organizationId, string content)
    {
        // システムルームを取得または作成
        var room = await _chatRoomService.GetOrCreateSystemRoomAsync(organizationId, SystemUserId);

        // システムメッセージを送信（SignalR 通知は ChatMessageService 内で実行される）
        var message = await _chatMessageService.SendSystemMessageAsync(room.Id, content);

        _logger.LogInformation(
            "System notification sent: OrganizationId={OrganizationId}, MessageId={MessageId}, Content={Content}",
            organizationId,
            message.Id,
            content.Length > 100 ? content[..100] + "..." : content
        );

        return message;
    }

    /// <summary>
    /// 複数の組織に同一のシステム通知を送信する。
    /// </summary>
    /// <param name="organizationIds">組織IDリスト</param>
    /// <param name="content">メッセージ内容</param>
    /// <returns>作成されたメッセージのリスト</returns>
    public async Task<List<ChatMessage>> SendToMultipleOrganizationsAsync(
        IEnumerable<int> organizationIds,
        string content
    )
    {
        var messages = new List<ChatMessage>();

        foreach (var organizationId in organizationIds)
        {
            try
            {
                var message = await SendAsync(organizationId, content);
                messages.Add(message);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to send system notification to organization: OrganizationId={OrganizationId}",
                    organizationId
                );
            }
        }

        return messages;
    }

    /// <summary>
    /// 全組織にシステム通知を送信する（運営からの全体アナウンス用）。
    /// </summary>
    /// <param name="content">メッセージ内容</param>
    /// <returns>作成されたメッセージのリスト</returns>
    public async Task<List<ChatMessage>> SendToAllOrganizationsAsync(string content)
    {
        var organizationIds = await _context
            .Organizations.Where(o => o.IsActive)
            .Select(o => o.Id)
            .ToListAsync();

        _logger.LogInformation(
            "Sending system notification to all organizations: Count={Count}",
            organizationIds.Count
        );

        return await SendToMultipleOrganizationsAsync(organizationIds, content);
    }

    /// <summary>
    /// 組織グループに直接 SignalR 通知のみを送信する（DB保存なし）。
    /// 一時的な通知や、別途メッセージを保存済みの場合に使用。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="eventType">イベント種別</param>
    /// <param name="payload">通知データ</param>
    public async Task PublishToOrganizationAsync(int organizationId, string eventType, object payload)
    {
        var groupName = $"organization:{organizationId}";

        await _hubContext
            .Clients.Group(groupName)
            .SendAsync(
                "ReceiveNotification",
                new
                {
                    EventType = eventType,
                    Payload = payload,
                    Timestamp = DateTimeOffset.UtcNow,
                }
            );

        _logger.LogDebug(
            "SignalR notification published: OrganizationId={OrganizationId}, EventType={EventType}",
            organizationId,
            eventType
        );
    }

    /// <summary>
    /// 複数の組織グループに直接 SignalR 通知を送信する（DB保存なし）。
    /// </summary>
    /// <param name="organizationIds">組織IDリスト</param>
    /// <param name="eventType">イベント種別</param>
    /// <param name="payload">通知データ</param>
    public async Task PublishToMultipleOrganizationsAsync(
        IEnumerable<int> organizationIds,
        string eventType,
        object payload
    )
    {
        var tasks = organizationIds.Select(orgId => PublishToOrganizationAsync(orgId, eventType, payload));
        await Task.WhenAll(tasks);
    }

    /// <summary>
    /// 全組織グループに直接 SignalR 通知を送信する（DB保存なし）。
    /// </summary>
    /// <param name="eventType">イベント種別</param>
    /// <param name="payload">通知データ</param>
    public async Task PublishToAllOrganizationsAsync(string eventType, object payload)
    {
        var organizationIds = await _context
            .Organizations.Where(o => o.IsActive)
            .Select(o => o.Id)
            .ToListAsync();

        await PublishToMultipleOrganizationsAsync(organizationIds, eventType, payload);
    }
}
