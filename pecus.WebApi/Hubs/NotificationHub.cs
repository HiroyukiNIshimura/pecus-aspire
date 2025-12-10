using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Pecus.Libs;

namespace Pecus.Hubs;

/// <summary>
/// リアルタイム通知用の SignalR Hub。
/// グループ管理のみを担当し、通知送信は NotificationService から行う。
/// </summary>
/// <remarks>
/// グループ設計:
/// - organization:{organizationId} - ログイン成功時に自動参加、ログアウトまで保持
/// - workspace:{workspaceId} - ワークスペースページ表示中のみ参加（排他的）
/// - item:{itemId} - アイテム詳細表示中のみ参加（排他的、workspace にも同時参加）
/// - user:{userId} - 将来の個人チャット用（ペンディング）
/// </remarks>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;
    private readonly OrganizationAccessHelper _accessHelper;

    public NotificationHub(ILogger<NotificationHub> logger, OrganizationAccessHelper accessHelper)
    {
        _logger = logger;
        _accessHelper = accessHelper;
    }

    /// <summary>
    /// クライアント接続時の処理。
    /// 組織グループに自動参加させる。
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var organizationId = GetOrganizationId();

        if (organizationId.HasValue)
        {
            var groupName = $"organization:{organizationId.Value}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation(
                "SignalR: User {UserId} connected and joined {GroupName}. ConnectionId={ConnectionId}",
                userId, groupName, Context.ConnectionId);
        }
        else
        {
            _logger.LogInformation(
                "SignalR: User {UserId} connected (no organization). ConnectionId={ConnectionId}",
                userId, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// クライアント切断時の処理。
    /// グループからの離脱は SignalR が自動で行う。
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();

        if (exception != null)
        {
            _logger.LogWarning(exception,
                "SignalR: User {UserId} disconnected with error. ConnectionId={ConnectionId}",
                userId, Context.ConnectionId);
        }
        else
        {
            _logger.LogInformation(
                "SignalR: User {UserId} disconnected. ConnectionId={ConnectionId}",
                userId, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// ワークスペースグループに参加する。
    /// 他のワークスペースから自動的に離脱する（排他的参加）。
    /// ワークスペースの有効なメンバーでない場合はグループに参加しない。
    /// </summary>
    /// <param name="workspaceId">参加するワークスペースID</param>
    /// <param name="previousWorkspaceId">離脱するワークスペースID（なければ null または 0）</param>
    public async Task JoinWorkspace(int workspaceId, int? previousWorkspaceId = null)
    {
        var userId = GetUserId();

        // ワークスペースの有効なメンバーかチェック
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(userId, workspaceId);
        if (!isMember)
        {
            _logger.LogDebug(
                "SignalR: User {UserId} is not a member of workspace {WorkspaceId}, skipping join",
                userId, workspaceId);
            return;
        }

        // 前のワークスペースから離脱
        if (previousWorkspaceId.HasValue && previousWorkspaceId.Value > 0 && previousWorkspaceId.Value != workspaceId)
        {
            var prevGroupName = $"workspace:{previousWorkspaceId.Value}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, prevGroupName);
            _logger.LogDebug(
                "SignalR: ConnectionId={ConnectionId} left {GroupName} (switching workspace)",
                Context.ConnectionId, prevGroupName);
        }

        // 新しいワークスペースに参加
        var groupName = $"workspace:{workspaceId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogDebug(
            "SignalR: ConnectionId={ConnectionId} joined {GroupName}",
            Context.ConnectionId, groupName);
    }

    /// <summary>
    /// ワークスペースグループから離脱する。
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    public async Task LeaveWorkspace(int workspaceId)
    {
        var groupName = $"workspace:{workspaceId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogDebug(
            "SignalR: ConnectionId={ConnectionId} left {GroupName}",
            Context.ConnectionId, groupName);
    }

    /// <summary>
    /// アイテムグループに参加する。
    /// 他のアイテムから自動的に離脱する（排他的参加）。
    /// ワークスペースグループにも同時に参加する。
    /// ワークスペースの有効なメンバーでない場合はグループに参加しない。
    /// </summary>
    /// <param name="itemId">参加するアイテムID</param>
    /// <param name="workspaceId">アイテムが属するワークスペースID</param>
    /// <param name="previousItemId">離脱するアイテムID（なければ null または 0）</param>
    /// <param name="previousWorkspaceId">離脱するワークスペースID（なければ null または 0）</param>
    public async Task JoinItem(int itemId, int workspaceId, int? previousItemId = null, int? previousWorkspaceId = null)
    {
        var userId = GetUserId();

        // ワークスペースの有効なメンバーかチェック
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(userId, workspaceId);
        if (!isMember)
        {
            _logger.LogDebug(
                "SignalR: User {UserId} is not a member of workspace {WorkspaceId}, skipping item join",
                userId, workspaceId);
            return;
        }

        // 前のアイテムから離脱
        if (previousItemId.HasValue && previousItemId.Value > 0 && previousItemId.Value != itemId)
        {
            var prevItemGroup = $"item:{previousItemId.Value}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, prevItemGroup);
            _logger.LogDebug(
                "SignalR: ConnectionId={ConnectionId} left {GroupName} (switching item)",
                Context.ConnectionId, prevItemGroup);
        }

        // ワークスペースも変わる場合は切り替え
        if (previousWorkspaceId.HasValue && previousWorkspaceId.Value > 0 && previousWorkspaceId.Value != workspaceId)
        {
            var prevWorkspaceGroup = $"workspace:{previousWorkspaceId.Value}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, prevWorkspaceGroup);
            _logger.LogDebug(
                "SignalR: ConnectionId={ConnectionId} left {GroupName} (switching workspace via item)",
                Context.ConnectionId, prevWorkspaceGroup);
        }

        // ワークスペースグループに参加
        var workspaceGroup = $"workspace:{workspaceId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, workspaceGroup);

        // アイテムグループに参加
        var itemGroup = $"item:{itemId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, itemGroup);

        _logger.LogDebug(
            "SignalR: ConnectionId={ConnectionId} joined {ItemGroup} and {WorkspaceGroup}",
            Context.ConnectionId, itemGroup, workspaceGroup);
    }

    /// <summary>
    /// アイテムグループから離脱する。
    /// ワークスペースグループには残る。
    /// </summary>
    /// <param name="itemId">アイテムID</param>
    public async Task LeaveItem(int itemId)
    {
        var groupName = $"item:{itemId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogDebug(
            "SignalR: ConnectionId={ConnectionId} left {GroupName}",
            Context.ConnectionId, groupName);
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

    /// <summary>
    /// JWT トークンから組織IDを取得する。
    /// </summary>
    private int? GetOrganizationId()
    {
        var principal = Context.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        try
        {
            return JwtBearerUtil.GetOrganizationIdFromPrincipal(principal);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR: Failed to get OrganizationId from principal");
            return null;
        }
    }
}
