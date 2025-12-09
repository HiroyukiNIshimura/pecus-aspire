using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Pecus.Libs;
using System.Collections.Concurrent;

namespace Pecus.Hubs;

/// <summary>
/// リアルタイム通知用の SignalR Hub。
/// ユーザー、組織、ワークスペース単位でグループ管理を行い、
/// 各種イベント通知をクライアントにプッシュする。
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    /// <summary>
    /// React StrictMode 対策: 短時間内の重複参加通知を防ぐ。
    /// キー: "ConnectionId:GroupName", 値: 最終参加時刻
    /// </summary>
    private static readonly ConcurrentDictionary<string, DateTime> _recentJoins = new();
    private static readonly TimeSpan _joinDebounceTime = TimeSpan.FromMilliseconds(500);

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// クライアント接続時の処理。
    /// ユーザー固有のグループに自動参加させる。
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId != 0)
        {
            // ユーザー固有のグループに参加（個人通知用）
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
            _logger.LogInformation("SignalR: User {UserId} connected. ConnectionId={ConnectionId}", userId, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// クライアント切断時の処理。
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId != 0)
        {
            _logger.LogInformation("SignalR: User {UserId} disconnected. ConnectionId={ConnectionId}", userId, Context.ConnectionId);
        }

        if (exception != null)
        {
            _logger.LogWarning(exception, "SignalR: Disconnected with error. ConnectionId={ConnectionId}", Context.ConnectionId);
        }

        // 切断時に該当接続の参加記録をクリア
        var keysToRemove = _recentJoins.Keys
            .Where(k => k.StartsWith($"{Context.ConnectionId}:"))
            .ToList();
        foreach (var key in keysToRemove)
        {
            _recentJoins.TryRemove(key, out _);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// 組織グループに参加する。
    /// クライアントが組織ページを開いた際に呼び出す。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    public async Task JoinOrganization(int organizationId)
    {
        var groupName = $"organization:{organizationId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogDebug("SignalR: ConnectionId={ConnectionId} joined {GroupName}", Context.ConnectionId, groupName);
    }

    /// <summary>
    /// 組織グループから離脱する。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    public async Task LeaveOrganization(int organizationId)
    {
        var groupName = $"organization:{organizationId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogDebug("SignalR: ConnectionId={ConnectionId} left {GroupName}", Context.ConnectionId, groupName);
    }

    /// <summary>
    /// ワークスペースグループに参加する。
    /// クライアントがワークスペースページを開いた際に呼び出す。
    /// 他のワークスペースメンバーに参加通知を送信する。
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="userName">ユーザー名（表示用）</param>
    public async Task JoinWorkspace(int workspaceId, string userName)
    {
        var groupName = $"workspace:{workspaceId}";
        var userId = GetUserId();
        var joinKey = $"{Context.ConnectionId}:{groupName}";
        var now = DateTime.UtcNow;

        // React StrictMode 対策: 短時間内の重複参加は通知をスキップ
        var shouldNotify = true;
        if (_recentJoins.TryGetValue(joinKey, out var lastJoinTime))
        {
            if (now - lastJoinTime < _joinDebounceTime)
            {
                shouldNotify = false;
                _logger.LogDebug("SignalR: Skipping duplicate join notification for {GroupName}. ConnectionId={ConnectionId}", groupName, Context.ConnectionId);
            }
        }
        _recentJoins[joinKey] = now;

        // グループに参加
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // 他のメンバーに参加通知を送信（重複でない場合のみ）
        if (shouldNotify)
        {
            await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("ReceiveNotification", new
            {
                EventType = "workspace:user_joined",
                Payload = new
                {
                    WorkspaceId = workspaceId,
                    UserId = userId,
                    UserName = userName,
                    Message = $"{userName}がワークスペースにやってきました！"
                },
                Timestamp = DateTimeOffset.UtcNow
            });
        }

        _logger.LogDebug("SignalR: ConnectionId={ConnectionId} joined {GroupName}, notified={Notified}", Context.ConnectionId, groupName, shouldNotify);
    }

    /// <summary>
    /// ワークスペースグループから離脱する。
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    public async Task LeaveWorkspace(int workspaceId)
    {
        var groupName = $"workspace:{workspaceId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        // 注意: 離脱時に _recentJoins をクリアしない（StrictMode で Leave→Join が短時間で発生するため）
        _logger.LogDebug("SignalR: ConnectionId={ConnectionId} left {GroupName}", Context.ConnectionId, groupName);
    }

    /// <summary>
    /// JWT トークンからユーザーIDを取得する。
    /// </summary>
    private int GetUserId()
    {
        var principal = Context.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return 0;
        }

        try
        {
            return JwtBearerUtil.GetUserIdFromPrincipal(principal);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR: Failed to get UserId from principal");
            return 0;
        }
    }
}
