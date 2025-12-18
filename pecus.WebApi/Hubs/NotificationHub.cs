using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Services;

namespace Pecus.Hubs;

/// <summary>
/// ワークスペースに入室中のユーザー情報
/// </summary>
public record WorkspacePresenceUser(
    int UserId,
    string UserName,
    string? IdentityIconUrl
);

/// <summary>
/// 組織/アイテムに入室中のユーザー情報（汎用）
/// </summary>
public record PresenceUser(
    int UserId,
    string UserName,
    string? IdentityIconUrl
);

/// <summary>
/// リアルタイム通知用の SignalR Hub。
/// グループ管理のみを担当し、通知送信は NotificationService から行う。
/// プレゼンス情報は Redis で管理し、スケールアウトに対応。
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
    private readonly ApplicationDbContext _context;
    private readonly SignalRPresenceService _presenceService;

    public NotificationHub(
        ILogger<NotificationHub> logger,
        OrganizationAccessHelper accessHelper,
        ApplicationDbContext context,
        SignalRPresenceService presenceService)
    {
        _logger = logger;
        _accessHelper = accessHelper;
        _context = context;
        _presenceService = presenceService;
    }

    /// <summary>
    /// クライアント接続時の処理。
    /// 組織グループに自動参加させる。
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var organizationId = GetOrganizationId();

        // Redis に接続情報を登録（組織情報も含む）
        await _presenceService.RegisterConnectionAsync(Context.ConnectionId, userId, organizationId);

        if (organizationId.HasValue)
        {
            var groupName = $"organization:{organizationId.Value}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            // 組織メンバーに参加を通知
            await NotifyOrganizationUserJoined(organizationId.Value, userId);

            _logger.LogDebug(
                "SignalR: User {UserId} connected and joined {GroupName}. ConnectionId={ConnectionId}",
                userId, groupName, Context.ConnectionId);
        }
        else
        {
            _logger.LogDebug(
                "SignalR: User {UserId} connected (no organization). ConnectionId={ConnectionId}",
                userId, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// クライアント切断時の処理。
    /// グループからの離脱は SignalR が自動で行う。
    /// 参加中のワークスペース/アイテム/組織があれば離脱通知を送信する。
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();

        // 編集状態があれば解除して通知
        var editingItemId = await _presenceService.GetConnectionEditingItemIdAsync(Context.ConnectionId);
        if (editingItemId.HasValue)
        {
            await _presenceService.RemoveItemEditorAsync(editingItemId.Value, Context.ConnectionId);

            var editGroupName = $"item:{editingItemId.Value}";
            await Clients.Group(editGroupName).SendAsync("ReceiveNotification", new
            {
                EventType = "item:edit_ended",
                Payload = new
                {
                    ItemId = editingItemId.Value,
                    UserId = userId
                },
                Timestamp = DateTimeOffset.UtcNow
            });

            _logger.LogDebug(
                "SignalR: User {UserId} ended editing item {ItemId} on disconnect",
                userId, editingItemId.Value);
        }

        // 参加中のアイテムがあれば離脱通知を送信
        var itemId = await _presenceService.GetConnectionItemAsync(Context.ConnectionId);
        if (itemId.HasValue)
        {
            await NotifyItemUserLeft(itemId.Value, userId);
            _logger.LogDebug(
                "SignalR: User {UserId} left item {ItemId} on disconnect",
                userId, itemId.Value);
        }

        // 参加中のワークスペースがあれば離脱通知を送信
        var workspaceId = await _presenceService.GetConnectionWorkspaceAsync(Context.ConnectionId);
        if (workspaceId.HasValue)
        {
            await NotifyWorkspaceUserLeft(workspaceId.Value, userId);
            _logger.LogDebug(
                "SignalR: User {UserId} left workspace {WorkspaceId} on disconnect",
                userId, workspaceId.Value);
        }

        // 参加中の組織があれば離脱通知を送信
        var organizationId = await _presenceService.GetConnectionOrganizationAsync(Context.ConnectionId);
        if (organizationId.HasValue)
        {
            await NotifyOrganizationUserLeft(organizationId.Value, userId);
            _logger.LogDebug(
                "SignalR: User {UserId} left organization {OrganizationId} on disconnect",
                userId, organizationId.Value);
        }

        // Redis から接続情報を削除
        await _presenceService.UnregisterConnectionAsync(Context.ConnectionId);

        if (exception != null)
        {
            _logger.LogWarning(exception,
                "SignalR: User {UserId} disconnected with error. ConnectionId={ConnectionId}",
                userId, Context.ConnectionId);
        }
        else
        {
            _logger.LogDebug(
                "SignalR: User {UserId} disconnected. ConnectionId={ConnectionId}",
                userId, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// ワークスペースグループに参加する。
    /// 他のワークスペースから自動的に離脱する（排他的参加）。
    /// ワークスペースの有効なメンバーでない場合はグループに参加しない。
    /// 参加時に他のメンバーへ通知を送信する。
    /// </summary>
    /// <param name="workspaceId">参加するワークスペースID</param>
    /// <returns>既に入室しているユーザー一覧</returns>
    public async Task<List<WorkspacePresenceUser>> JoinWorkspace(int workspaceId)
    {
        var userId = GetUserId();

        _logger.LogDebug(
            "SignalR JoinWorkspace: userId={UserId}, workspaceId={WorkspaceId}, connectionId={ConnectionId}",
            userId, workspaceId, Context.ConnectionId);

        // ワークスペースの有効なメンバーかチェック
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(userId, workspaceId);
        if (!isMember)
        {
            _logger.LogDebug(
                "SignalR: User {UserId} is not a member of workspace {WorkspaceId}, skipping join",
                userId, workspaceId);
            return [];
        }

        // 前のワークスペースから離脱（Redis から取得して SignalR グループからも削除）
        var currentWorkspaceId = await _presenceService.GetConnectionWorkspaceAsync(Context.ConnectionId);
        if (currentWorkspaceId.HasValue && currentWorkspaceId.Value != workspaceId)
        {
            var prevGroupName = $"workspace:{currentWorkspaceId.Value}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, prevGroupName);

            // 前のワークスペースのメンバーに離脱を通知
            await NotifyWorkspaceUserLeft(currentWorkspaceId.Value, userId);

            _logger.LogDebug(
                "SignalR: ConnectionId={ConnectionId} left {GroupName} (switching workspace)",
                Context.ConnectionId, prevGroupName);
        }

        // 既にこのワークスペースに入室しているユーザーIDを Redis から取得（自分以外）
        var existingUserIds = await _presenceService.GetWorkspaceUserIdsAsync(workspaceId, Context.ConnectionId);

        // DBからユーザー情報を取得
        var userInfos = await _context.Users
            .Where(u => existingUserIds.Contains(u.Id) && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.AvatarType,
                u.UserAvatarPath
            })
            .ToListAsync();

        var existingUsers = userInfos.Select(u => new WorkspacePresenceUser(
            u.Id,
            u.Username,
            IdentityIconHelper.GetIdentityIconUrl(u.AvatarType, u.Id, u.Username, u.Email, u.UserAvatarPath)
        )).ToList();

        // 新しいワークスペースに参加（SignalR グループ）
        var groupName = $"workspace:{workspaceId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // Redis にワークスペース情報を登録
        await _presenceService.AddConnectionToWorkspaceAsync(Context.ConnectionId, workspaceId);

        // 他のメンバーに参加を通知
        await NotifyWorkspaceUserJoined(workspaceId, userId);

        _logger.LogDebug(
            "SignalR: ConnectionId={ConnectionId} joined {GroupName}",
            Context.ConnectionId, groupName);

        // 既存ユーザー一覧を返す
        return existingUsers;
    }

    /// <summary>
    /// ワークスペースグループから離脱する。
    /// 離脱時に他のメンバーへ通知を送信する。
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    public async Task LeaveWorkspace(int workspaceId)
    {
        var userId = GetUserId();

        _logger.LogDebug(
            "SignalR LeaveWorkspace: userId={UserId}, workspaceId={WorkspaceId}, connectionId={ConnectionId}",
            userId, workspaceId, Context.ConnectionId);

        var groupName = $"workspace:{workspaceId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        // Redis からワークスペース情報を削除
        await _presenceService.RemoveConnectionFromWorkspaceAsync(Context.ConnectionId, workspaceId);

        // 他のメンバーに離脱を通知
        await NotifyWorkspaceUserLeft(workspaceId, userId);

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
    /// <returns>既に入室しているユーザー一覧</returns>
    public async Task<List<PresenceUser>> JoinItem(int itemId, int workspaceId)
    {
        var userId = GetUserId();

        _logger.LogDebug(
            "SignalR JoinItem: userId={UserId}, itemId={ItemId}, workspaceId={WorkspaceId}, connectionId={ConnectionId}",
            userId, itemId, workspaceId, Context.ConnectionId);

        // ワークスペースの有効なメンバーかチェック
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(userId, workspaceId);
        if (!isMember)
        {
            _logger.LogDebug(
                "SignalR: User {UserId} is not a member of workspace {WorkspaceId}, skipping item join",
                userId, workspaceId);
            return [];
        }

        // 前のアイテムから離脱（Redis から取得）
        var currentItemId = await _presenceService.GetConnectionItemAsync(Context.ConnectionId);
        if (currentItemId.HasValue && currentItemId.Value != itemId)
        {
            var prevItemGroup = $"item:{currentItemId.Value}";

            // 以前のアイテムを編集中であれば解除して通知
            var editingItemId = await _presenceService.GetConnectionEditingItemIdAsync(Context.ConnectionId);
            if (editingItemId.HasValue && editingItemId.Value == currentItemId.Value)
            {
                await _presenceService.RemoveItemEditorAsync(currentItemId.Value, Context.ConnectionId);

                await Clients.Group(prevItemGroup).SendAsync("ReceiveNotification", new
                {
                    EventType = "item:edit_ended",
                    Payload = new
                    {
                        ItemId = currentItemId.Value,
                        UserId = userId
                    },
                    Timestamp = DateTimeOffset.UtcNow
                });
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, prevItemGroup);

            // 前のアイテムのメンバーに離脱を通知
            await NotifyItemUserLeft(currentItemId.Value, userId);

            _logger.LogDebug(
                "SignalR: ConnectionId={ConnectionId} left {GroupName} (switching item)",
                Context.ConnectionId, prevItemGroup);
        }

        // 前のワークスペースから離脱（Redis から取得）
        var currentWorkspaceId = await _presenceService.GetConnectionWorkspaceAsync(Context.ConnectionId);
        if (currentWorkspaceId.HasValue && currentWorkspaceId.Value != workspaceId)
        {
            var prevWorkspaceGroup = $"workspace:{currentWorkspaceId.Value}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, prevWorkspaceGroup);

            // 前のワークスペースのメンバーに離脱を通知
            await NotifyWorkspaceUserLeft(currentWorkspaceId.Value, userId);

            _logger.LogDebug(
                "SignalR: ConnectionId={ConnectionId} left {GroupName} (switching workspace via item)",
                Context.ConnectionId, prevWorkspaceGroup);
        }

        // 既にこのアイテムに入室しているユーザーIDを Redis から取得（自分以外）
        var existingUserIds = await _presenceService.GetItemUserIdsAsync(itemId, Context.ConnectionId);

        // DBからユーザー情報を取得
        var userInfos = await _context.Users
            .Where(u => existingUserIds.Contains(u.Id) && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.AvatarType,
                u.UserAvatarPath
            })
            .ToListAsync();

        var existingUsers = userInfos.Select(u => new PresenceUser(
            u.Id,
            u.Username,
            IdentityIconHelper.GetIdentityIconUrl(u.AvatarType, u.Id, u.Username, u.Email, u.UserAvatarPath)
        )).ToList();

        // ワークスペースグループに参加
        var workspaceGroup = $"workspace:{workspaceId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, workspaceGroup);

        // Redis にワークスペース情報を登録
        await _presenceService.AddConnectionToWorkspaceAsync(Context.ConnectionId, workspaceId);

        // ワークスペースが変わった場合は参加通知
        if (!currentWorkspaceId.HasValue || currentWorkspaceId.Value != workspaceId)
        {
            await NotifyWorkspaceUserJoined(workspaceId, userId);
        }

        // アイテムグループに参加
        var itemGroup = $"item:{itemId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, itemGroup);

        // Redis にアイテム情報を登録
        await _presenceService.AddConnectionToItemAsync(Context.ConnectionId, itemId);

        // アイテムが変わった場合は参加通知
        if (!currentItemId.HasValue || currentItemId.Value != itemId)
        {
            await NotifyItemUserJoined(itemId, userId);
        }

        _logger.LogDebug(
            "SignalR: ConnectionId={ConnectionId} joined {ItemGroup} and {WorkspaceGroup}",
            Context.ConnectionId, itemGroup, workspaceGroup);

        return existingUsers;
    }

    /// <summary>
    /// アイテムグループから離脱する。
    /// ワークスペースグループには残る。
    /// </summary>
    /// <param name="itemId">アイテムID</param>
    public async Task LeaveItem(int itemId)
    {
        _logger.LogDebug(
            "SignalR LeaveItem: itemId={ItemId}, connectionId={ConnectionId}",
            itemId, Context.ConnectionId);

        var groupName = $"item:{itemId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        // 編集状態がこの接続に紐付いていれば解除して通知
        var editingItemId = await _presenceService.GetConnectionEditingItemIdAsync(Context.ConnectionId);
        if (editingItemId.HasValue && editingItemId.Value == itemId)
        {
            await _presenceService.RemoveItemEditorAsync(itemId, Context.ConnectionId);

            await Clients.Group(groupName).SendAsync("ReceiveNotification", new
            {
                EventType = "item:edit_ended",
                Payload = new
                {
                    ItemId = itemId,
                    UserId = GetUserId()
                },
                Timestamp = DateTimeOffset.UtcNow
            });
        }

        // Redis からアイテム情報を削除
        await _presenceService.RemoveConnectionFromItemAsync(Context.ConnectionId, itemId);

        // アイテム参加者に離脱を通知
        var userId = GetUserId();
        if (userId != 0)
        {
            await NotifyItemUserLeft(itemId, userId);
        }

        _logger.LogDebug(
            "SignalR: ConnectionId={ConnectionId} left {GroupName}",
            Context.ConnectionId, groupName);
    }

    /// <summary>
    /// アイテム編集を開始する。
    /// </summary>
    public async Task StartItemEdit(int itemId)
    {
        if (itemId <= 0)
        {
            throw new HubException("Invalid itemId");
        }

        var userId = GetUserId();
        if (userId == 0)
        {
            throw new HubException("Unauthorized");
        }

        var user = await _context.Users
            .Where(u => u.Id == userId && u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.AvatarType,
                u.UserAvatarPath
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            _logger.LogWarning("SignalR: User {UserId} not found when starting item edit", userId);
            return;
        }

        var identityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
            user.AvatarType,
            user.Id,
            user.Username,
            user.Email,
            user.UserAvatarPath);

        await _presenceService.SetItemEditorAsync(itemId, userId, user.Username, identityIconUrl, Context.ConnectionId);

        var groupName = $"item:{itemId}";
        await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("ReceiveNotification", new
        {
            EventType = "item:edit_started",
            Payload = new
            {
                ItemId = itemId,
                UserId = userId,
                UserName = user.Username,
                IdentityIconUrl = identityIconUrl
            },
            Timestamp = DateTimeOffset.UtcNow
        });

        _logger.LogDebug(
            "SignalR: User {UserId} started editing item {ItemId}",
            userId, itemId);
    }

    /// <summary>
    /// アイテム編集を終了する。
    /// </summary>
    public async Task EndItemEdit(int itemId)
    {
        if (itemId <= 0)
        {
            throw new HubException("Invalid itemId");
        }

        var userId = GetUserId();
        if (userId == 0)
        {
            throw new HubException("Unauthorized");
        }

        await _presenceService.RemoveItemEditorAsync(itemId, Context.ConnectionId);

        var groupName = $"item:{itemId}";
        await Clients.Group(groupName).SendAsync("ReceiveNotification", new
        {
            EventType = "item:edit_ended",
            Payload = new
            {
                ItemId = itemId,
                UserId = userId
            },
            Timestamp = DateTimeOffset.UtcNow
        });

        _logger.LogDebug(
            "SignalR: User {UserId} ended editing item {ItemId}",
            userId, itemId);
    }

    /// <summary>
    /// 現在のアイテム編集状態を取得する。
    /// </summary>
    public async Task<ItemEditStatus> GetItemEditStatus(int itemId)
    {
        if (itemId <= 0)
        {
            throw new HubException("Invalid itemId");
        }

        var editor = await _presenceService.GetItemEditorAsync(itemId);
        if (editor == null)
        {
            return new ItemEditStatus(false, null);
        }

        return new ItemEditStatus(true, editor);
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

    /// <summary>
    /// ワークスペースにユーザーが参加したことを他のメンバーに通知する。
    /// </summary>
    private async Task NotifyWorkspaceUserJoined(int workspaceId, int userId)
    {
        try
        {
            // ユーザー情報を取得
            var user = await _context.Users
                .Where(u => u.Id == userId && u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.AvatarType,
                    u.UserAvatarPath
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                _logger.LogWarning("SignalR: User {UserId} not found for presence notification", userId);
                return;
            }

            var identityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                user.AvatarType,
                user.Id,
                user.Username,
                user.Email,
                user.UserAvatarPath);

            var groupName = $"workspace:{workspaceId}";
            await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("ReceiveNotification", new
            {
                EventType = "workspace:user_joined",
                Payload = new
                {
                    WorkspaceId = workspaceId,
                    UserId = userId,
                    UserName = user.Username,
                    IdentityIconUrl = identityIconUrl
                },
                Timestamp = DateTimeOffset.UtcNow
            });

            _logger.LogDebug(
                "SignalR: Notified workspace:{WorkspaceId} that user {UserId} joined",
                workspaceId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SignalR: Failed to notify workspace user joined");
        }
    }

    /// <summary>
    /// ワークスペースからユーザーが離脱したことを他のメンバーに通知する。
    /// </summary>
    private async Task NotifyWorkspaceUserLeft(int workspaceId, int userId)
    {
        try
        {
            var groupName = $"workspace:{workspaceId}";
            await Clients.Group(groupName).SendAsync("ReceiveNotification", new
            {
                EventType = "workspace:user_left",
                Payload = new
                {
                    WorkspaceId = workspaceId,
                    UserId = userId
                },
                Timestamp = DateTimeOffset.UtcNow
            });

            _logger.LogDebug(
                "SignalR: Notified workspace:{WorkspaceId} that user {UserId} left",
                workspaceId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SignalR: Failed to notify workspace user left");
        }
    }

    /// <summary>
    /// 組織にユーザーが参加したことを他のメンバーに通知する。
    /// </summary>
    private async Task NotifyOrganizationUserJoined(int organizationId, int userId)
    {
        try
        {
            // ユーザー情報を取得
            var user = await _context.Users
                .Where(u => u.Id == userId && u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.AvatarType,
                    u.UserAvatarPath
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                _logger.LogWarning("SignalR: User {UserId} not found for organization presence notification", userId);
                return;
            }

            var identityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                user.AvatarType,
                user.Id,
                user.Username,
                user.Email,
                user.UserAvatarPath);

            var groupName = $"organization:{organizationId}";
            await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("ReceiveNotification", new
            {
                EventType = "organization:user_joined",
                Payload = new
                {
                    OrganizationId = organizationId,
                    UserId = userId,
                    UserName = user.Username,
                    IdentityIconUrl = identityIconUrl
                },
                Timestamp = DateTimeOffset.UtcNow
            });

            _logger.LogDebug(
                "SignalR: Notified organization:{OrganizationId} that user {UserId} joined",
                organizationId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SignalR: Failed to notify organization user joined");
        }
    }

    /// <summary>
    /// 組織からユーザーが離脱したことを他のメンバーに通知する。
    /// </summary>
    private async Task NotifyOrganizationUserLeft(int organizationId, int userId)
    {
        try
        {
            var groupName = $"organization:{organizationId}";
            await Clients.Group(groupName).SendAsync("ReceiveNotification", new
            {
                EventType = "organization:user_left",
                Payload = new
                {
                    OrganizationId = organizationId,
                    UserId = userId
                },
                Timestamp = DateTimeOffset.UtcNow
            });

            _logger.LogDebug(
                "SignalR: Notified organization:{OrganizationId} that user {UserId} left",
                organizationId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SignalR: Failed to notify organization user left");
        }
    }

    /// <summary>
    /// アイテムにユーザーが参加したことを他のメンバーに通知する。
    /// </summary>
    private async Task NotifyItemUserJoined(int itemId, int userId)
    {
        try
        {
            // ユーザー情報を取得
            var user = await _context.Users
                .Where(u => u.Id == userId && u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.AvatarType,
                    u.UserAvatarPath
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                _logger.LogWarning("SignalR: User {UserId} not found for item presence notification", userId);
                return;
            }

            var identityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                user.AvatarType,
                user.Id,
                user.Username,
                user.Email,
                user.UserAvatarPath);

            var groupName = $"item:{itemId}";
            await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("ReceiveNotification", new
            {
                EventType = "item:user_joined",
                Payload = new
                {
                    ItemId = itemId,
                    UserId = userId,
                    UserName = user.Username,
                    IdentityIconUrl = identityIconUrl
                },
                Timestamp = DateTimeOffset.UtcNow
            });

            _logger.LogDebug(
                "SignalR: Notified item:{ItemId} that user {UserId} joined",
                itemId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SignalR: Failed to notify item user joined");
        }
    }

    /// <summary>
    /// アイテムからユーザーが離脱したことを他のメンバーに通知する。
    /// </summary>
    private async Task NotifyItemUserLeft(int itemId, int userId)
    {
        try
        {
            var groupName = $"item:{itemId}";
            await Clients.Group(groupName).SendAsync("ReceiveNotification", new
            {
                EventType = "item:user_left",
                Payload = new
                {
                    ItemId = itemId,
                    UserId = userId
                },
                Timestamp = DateTimeOffset.UtcNow
            });

            _logger.LogDebug(
                "SignalR: Notified item:{ItemId} that user {UserId} left",
                itemId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SignalR: Failed to notify item user left");
        }
    }
}