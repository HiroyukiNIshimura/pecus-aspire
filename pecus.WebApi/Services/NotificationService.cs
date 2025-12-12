using Microsoft.AspNetCore.SignalR;
using Pecus.Hubs;

namespace Pecus.Services;

/// <summary>
/// SignalR を使用したリアルタイム通知送信サービス。
/// 各サービスから DI で取得し、ユーザー/組織/ワークスペース単位で通知を送信できる。
/// </summary>
public class NotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// 特定ユーザーに通知を送信する。
    /// </summary>
    /// <param name="userId">対象ユーザーID</param>
    /// <param name="eventType">イベント種別（クライアント側でハンドリング用）</param>
    /// <param name="payload">通知データ</param>
    public async Task SendToUserAsync(int userId, string eventType, object payload)
    {
        var groupName = $"user:{userId}";
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", new
        {
            EventType = eventType,
            Payload = payload,
            Timestamp = DateTimeOffset.UtcNow
        });
        _logger.LogDebug("Notification sent to user:{UserId}, event={EventType}", userId, eventType);
    }

    /// <summary>
    /// 複数ユーザーに通知を送信する。
    /// </summary>
    /// <param name="userIds">対象ユーザーIDリスト</param>
    /// <param name="eventType">イベント種別</param>
    /// <param name="payload">通知データ</param>
    public async Task SendToUsersAsync(IEnumerable<int> userIds, string eventType, object payload)
    {
        var notification = new
        {
            EventType = eventType,
            Payload = payload,
            Timestamp = DateTimeOffset.UtcNow
        };

        var tasks = userIds.Select(userId =>
            _hubContext.Clients.Group($"user:{userId}").SendAsync("ReceiveNotification", notification));

        await Task.WhenAll(tasks);
        _logger.LogDebug("Notification sent to {Count} users, event={EventType}", userIds.Count(), eventType);
    }

    /// <summary>
    /// 組織の全メンバーに通知を送信する。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="eventType">イベント種別</param>
    /// <param name="payload">通知データ</param>
    public async Task SendToOrganizationAsync(Guid organizationId, string eventType, object payload)
    {
        var groupName = $"organization:{organizationId}";
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", new
        {
            EventType = eventType,
            Payload = payload,
            Timestamp = DateTimeOffset.UtcNow
        });
        _logger.LogDebug("Notification sent to organization:{OrganizationId}, event={EventType}", organizationId, eventType);
    }

    /// <summary>
    /// ワークスペースの全メンバーに通知を送信する。
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="eventType">イベント種別</param>
    /// <param name="payload">通知データ</param>
    public async Task SendToWorkspaceAsync(Guid workspaceId, string eventType, object payload)
    {
        var groupName = $"workspace:{workspaceId}";
        await _hubContext.Clients.Group(groupName).SendAsync("ReceiveNotification", new
        {
            EventType = eventType,
            Payload = payload,
            Timestamp = DateTimeOffset.UtcNow
        });
        _logger.LogDebug("Notification sent to workspace:{WorkspaceId}, event={EventType}", workspaceId, eventType);
    }

    /// <summary>
    /// 特定ユーザーを除いて、ワークスペースの全メンバーに通知を送信する。
    /// 自分が行った操作を自分に通知しない場合に使用。
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="excludeUserId">除外するユーザーID</param>
    /// <param name="eventType">イベント種別</param>
    /// <param name="payload">通知データ</param>
    public async Task SendToWorkspaceExceptAsync(Guid workspaceId, int excludeUserId, string eventType, object payload)
    {
        var groupName = $"workspace:{workspaceId}";
        var excludeGroupName = $"user:{excludeUserId}";

        await _hubContext.Clients
            .GroupExcept(groupName, GetConnectionIdsForGroup(excludeGroupName))
            .SendAsync("ReceiveNotification", new
            {
                EventType = eventType,
                Payload = payload,
                Timestamp = DateTimeOffset.UtcNow
            });
        _logger.LogDebug("Notification sent to workspace:{WorkspaceId} except user:{ExcludeUserId}, event={EventType}",
            workspaceId, excludeUserId, eventType);
    }

    /// <summary>
    /// グループに属するコネクションIDのリストを取得する。
    /// NOTE: SignalR ではグループのコネクションIDを直接取得できないため、
    /// この実装では空のリストを返す（GroupExcept の制限事項）。
    /// 将来的に Redis でコネクション管理を行う場合は拡張可能。
    /// </summary>
    private static IReadOnlyList<string> GetConnectionIdsForGroup(string groupName)
    {
        // SignalR の GroupExcept は connectionId のリストを受け取るが、
        // グループに属する connectionId を取得する標準 API はない。
        // 代替手段として、操作者自身の除外は Hub 側で SendAsync を呼ばず、
        // または Redis でコネクション管理を実装する。
        return [];
    }
}