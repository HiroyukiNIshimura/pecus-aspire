using StackExchange.Redis;
using System.Text.Json;

namespace Pecus.Services;

/// <summary>
/// SignalR プレゼンス情報を Redis で管理するサービス。
/// スケールアウト環境でも正しく動作する。
/// </summary>
public class SignalRPresenceService
{
    private readonly IDatabase _db;
    private readonly ILogger<SignalRPresenceService> _logger;

    /// <summary>
    /// Redis db2 を使用（db0: トークン、db1: Hangfire）
    /// </summary>
    private const int DatabaseNumber = 2;

    /// <summary>
    /// 接続情報のTTL（接続が異常終了した場合のクリーンアップ用）
    /// </summary>
    private static readonly TimeSpan ConnectionTtl = TimeSpan.FromHours(24);

    // Redis キープレフィックス
    private const string ConnectionUserPrefix = "presence:conn_user:";           // ConnectionId → UserId
    private const string ConnectionWorkspacePrefix = "presence:conn_ws:";        // ConnectionId → WorkspaceId
    private const string ConnectionItemPrefix = "presence:conn_item:";           // ConnectionId → ItemId
    private const string ConnectionOrganizationPrefix = "presence:conn_org:";    // ConnectionId → OrganizationId
    private const string ItemEditorPrefix = "presence:item_editor:";             // ItemId → ItemEditor (Hash)
    private const string ItemEditorConnectionPrefix = "presence:item_editor_conn:"; // ConnectionId → ItemId
    private const string WorkspaceEditorPrefix = "presence:ws_editor:";          // WorkspaceId → WorkspaceEditor (Hash)
    private const string WorkspaceEditorConnectionPrefix = "presence:ws_editor_conn:"; // ConnectionId → WorkspaceId
    private const string WorkspaceConnectionsPrefix = "presence:ws_conns:";      // WorkspaceId → Set<ConnectionId>
    private const string ItemConnectionsPrefix = "presence:item_conns:";         // ItemId → Set<ConnectionId>
    private const string OrganizationConnectionsPrefix = "presence:org_conns:";  // OrganizationId → Set<ConnectionId>

    public SignalRPresenceService(IConnectionMultiplexer redis, ILogger<SignalRPresenceService> logger)
    {
        _db = redis.GetDatabase(DatabaseNumber);
        _logger = logger;
    }

    /// <summary>
    /// 接続時にユーザーIDを登録
    /// </summary>
    public async Task RegisterConnectionAsync(string connectionId, int userId, int? organizationId = null)
    {
        var key = $"{ConnectionUserPrefix}{connectionId}";
        await _db.StringSetAsync(key, userId.ToString(), ConnectionTtl);

        // 組織に参加
        if (organizationId.HasValue)
        {
            await AddConnectionToOrganizationAsync(connectionId, organizationId.Value);
        }
    }

    /// <summary>
    /// 切断時に接続情報をクリア
    /// </summary>
    public async Task UnregisterConnectionAsync(string connectionId)
    {
        // ワークスペースから削除
        var workspaceId = await GetConnectionWorkspaceAsync(connectionId);
        if (workspaceId.HasValue)
        {
            await RemoveConnectionFromWorkspaceAsync(connectionId, workspaceId.Value);
        }

        // アイテムから削除
        var itemId = await GetConnectionItemAsync(connectionId);
        if (itemId.HasValue)
        {
            await RemoveConnectionFromItemAsync(connectionId, itemId.Value);
        }

        // 組織から削除
        var organizationId = await GetConnectionOrganizationAsync(connectionId);
        if (organizationId.HasValue)
        {
            await RemoveConnectionFromOrganizationAsync(connectionId, organizationId.Value);
        }

        // 接続情報を削除
        var userKey = $"{ConnectionUserPrefix}{connectionId}";
        var wsKey = $"{ConnectionWorkspacePrefix}{connectionId}";
        var itemKey = $"{ConnectionItemPrefix}{connectionId}";
        var orgKey = $"{ConnectionOrganizationPrefix}{connectionId}";
        await _db.KeyDeleteAsync([userKey, wsKey, itemKey, orgKey]);
    }

    /// <summary>
    /// 接続からユーザーIDを取得
    /// </summary>
    public async Task<int?> GetConnectionUserIdAsync(string connectionId)
    {
        var key = $"{ConnectionUserPrefix}{connectionId}";
        var value = await _db.StringGetAsync(key);
        if (value.IsNullOrEmpty) return null;
        return int.TryParse(value.ToString(), out var userId) ? userId : null;
    }

    /// <summary>
    /// ワークスペースに接続を追加
    /// </summary>
    public async Task AddConnectionToWorkspaceAsync(string connectionId, int workspaceId)
    {
        // 前のワークスペースから削除
        var previousWorkspaceId = await GetConnectionWorkspaceAsync(connectionId);
        if (previousWorkspaceId.HasValue && previousWorkspaceId.Value != workspaceId)
        {
            await RemoveConnectionFromWorkspaceAsync(connectionId, previousWorkspaceId.Value);
        }

        // 新しいワークスペースに追加
        var wsKey = $"{ConnectionWorkspacePrefix}{connectionId}";
        var wsConnsKey = $"{WorkspaceConnectionsPrefix}{workspaceId}";

        await _db.StringSetAsync(wsKey, workspaceId.ToString(), ConnectionTtl);
        await _db.SetAddAsync(wsConnsKey, connectionId);
        // セットにもTTLを設定（最後の接続が切れた後のクリーンアップ用）
        await _db.KeyExpireAsync(wsConnsKey, ConnectionTtl);
    }

    /// <summary>
    /// ワークスペースから接続を削除
    /// </summary>
    public async Task RemoveConnectionFromWorkspaceAsync(string connectionId, int workspaceId)
    {
        var wsKey = $"{ConnectionWorkspacePrefix}{connectionId}";
        var wsConnsKey = $"{WorkspaceConnectionsPrefix}{workspaceId}";

        await _db.KeyDeleteAsync(wsKey);
        await _db.SetRemoveAsync(wsConnsKey, connectionId);
    }

    /// <summary>
    /// 接続の現在のワークスペースIDを取得
    /// </summary>
    public async Task<int?> GetConnectionWorkspaceAsync(string connectionId)
    {
        var key = $"{ConnectionWorkspacePrefix}{connectionId}";
        var value = await _db.StringGetAsync(key);
        if (value.IsNullOrEmpty) return null;
        return int.TryParse(value.ToString(), out var wsId) ? wsId : null;
    }

    /// <summary>
    /// ワークスペースに参加中のユーザーID一覧を取得（指定した接続を除く）
    /// </summary>
    public async Task<List<int>> GetWorkspaceUserIdsAsync(int workspaceId, string? excludeConnectionId = null)
    {
        var wsConnsKey = $"{WorkspaceConnectionsPrefix}{workspaceId}";
        var connectionIds = await _db.SetMembersAsync(wsConnsKey);

        var userIds = new HashSet<int>();
        foreach (var connId in connectionIds)
        {
            if (connId.IsNullOrEmpty) continue;
            var connectionIdStr = connId.ToString();

            // 除外する接続はスキップ
            if (excludeConnectionId != null && connectionIdStr == excludeConnectionId) continue;

            var userId = await GetConnectionUserIdAsync(connectionIdStr);
            if (userId.HasValue)
            {
                userIds.Add(userId.Value);
            }
        }

        return [.. userIds];
    }

    /// <summary>
    /// 接続の現在のアイテムIDを取得
    /// </summary>
    public async Task<int?> GetConnectionItemAsync(string connectionId)
    {
        var key = $"{ConnectionItemPrefix}{connectionId}";
        var value = await _db.StringGetAsync(key);
        if (value.IsNullOrEmpty) return null;
        return int.TryParse(value.ToString(), out var itemId) ? itemId : null;
    }

    /// <summary>
    /// 接続のアイテムIDを設定
    /// </summary>
    public async Task SetConnectionItemAsync(string connectionId, int itemId)
    {
        var key = $"{ConnectionItemPrefix}{connectionId}";
        await _db.StringSetAsync(key, itemId.ToString(), ConnectionTtl);
    }

    /// <summary>
    /// 接続のアイテム情報をクリア
    /// </summary>
    public async Task ClearConnectionItemAsync(string connectionId)
    {
        var itemId = await GetConnectionItemAsync(connectionId);
        if (itemId.HasValue)
        {
            await RemoveConnectionFromItemAsync(connectionId, itemId.Value);
        }

        var key = $"{ConnectionItemPrefix}{connectionId}";
        await _db.KeyDeleteAsync(key);
    }

    // ========================================
    // アイテム管理（Set ベース）
    // ========================================

    /// <summary>
    /// アイテムに接続を追加
    /// </summary>
    public async Task AddConnectionToItemAsync(string connectionId, int itemId)
    {
        // 前のアイテムから削除
        var previousItemId = await GetConnectionItemAsync(connectionId);
        if (previousItemId.HasValue && previousItemId.Value != itemId)
        {
            await RemoveConnectionFromItemAsync(connectionId, previousItemId.Value);
        }

        // 新しいアイテムに追加
        var itemConnsKey = $"{ItemConnectionsPrefix}{itemId}";
        await _db.SetAddAsync(itemConnsKey, connectionId);
        await _db.KeyExpireAsync(itemConnsKey, ConnectionTtl);

        // 接続のアイテムIDを更新
        var key = $"{ConnectionItemPrefix}{connectionId}";
        await _db.StringSetAsync(key, itemId.ToString(), ConnectionTtl);
    }

    /// <summary>
    /// アイテムから接続を削除
    /// </summary>
    public async Task RemoveConnectionFromItemAsync(string connectionId, int itemId)
    {
        var itemConnsKey = $"{ItemConnectionsPrefix}{itemId}";
        await _db.SetRemoveAsync(itemConnsKey, connectionId);
    }

    /// <summary>
    /// アイテムに参加中のユーザーID一覧を取得（指定した接続を除く）
    /// </summary>
    public async Task<List<int>> GetItemUserIdsAsync(int itemId, string? excludeConnectionId = null)
    {
        var itemConnsKey = $"{ItemConnectionsPrefix}{itemId}";
        var connectionIds = await _db.SetMembersAsync(itemConnsKey);

        var userIds = new HashSet<int>();
        foreach (var connId in connectionIds)
        {
            if (connId.IsNullOrEmpty) continue;
            var connectionIdStr = connId.ToString();

            if (excludeConnectionId != null && connectionIdStr == excludeConnectionId) continue;

            var userId = await GetConnectionUserIdAsync(connectionIdStr);
            if (userId.HasValue)
            {
                userIds.Add(userId.Value);
            }
        }

        return [.. userIds];
    }

    // ========================================
    // アイテム編集状態管理（Hash ベース）
    // ========================================

    /// <summary>
    /// アイテムの編集者を設定する。
    /// </summary>
    public async Task SetItemEditorAsync(int itemId, int userId, string userName, string? identityIconUrl, string connectionId)
    {
        var editorKey = $"{ItemEditorPrefix}{itemId}";
        var connectionKey = $"{ItemEditorConnectionPrefix}{connectionId}";

        var entries = new HashEntry[]
        {
            new("userId", userId),
            new("userName", userName),
            new("identityIconUrl", identityIconUrl ?? string.Empty),
            new("connectionId", connectionId)
        };

        await _db.HashSetAsync(editorKey, entries);
        await _db.StringSetAsync(connectionKey, itemId.ToString(), ConnectionTtl);
        await _db.KeyExpireAsync(editorKey, ConnectionTtl);
    }

    /// <summary>
    /// アイテムの編集者を解除する（connectionId が一致する場合のみ）。
    /// </summary>
    public async Task RemoveItemEditorAsync(int itemId, string connectionId)
    {
        var editor = await GetItemEditorAsync(itemId);
        if (editor == null)
        {
            return;
        }

        if (!string.Equals(editor.ConnectionId, connectionId, StringComparison.Ordinal))
        {
            _logger.LogDebug(
                "SignalRPresence: Skip removing item editor because connectionId mismatch. ItemId={ItemId}, Expected={Expected}, Actual={Actual}",
                itemId, editor.ConnectionId, connectionId);
            return;
        }

        var editorKey = $"{ItemEditorPrefix}{itemId}";
        await _db.KeyDeleteAsync(editorKey);

        var connectionKey = $"{ItemEditorConnectionPrefix}{connectionId}";
        var mappedItemId = await GetConnectionEditingItemIdAsync(connectionId);
        if (mappedItemId.HasValue && mappedItemId.Value == itemId)
        {
            await _db.KeyDeleteAsync(connectionKey);
        }
    }

    /// <summary>
    /// 現在のアイテム編集者を取得する。
    /// </summary>
    public async Task<ItemEditor?> GetItemEditorAsync(int itemId)
    {
        var editorKey = $"{ItemEditorPrefix}{itemId}";
        var entries = await _db.HashGetAllAsync(editorKey);
        if (entries == null || entries.Length == 0)
        {
            return null;
        }

        try
        {
            var dict = entries.ToDictionary(x => x.Name.ToString(), x => x.Value);

            if (!dict.TryGetValue("userId", out var userIdValue) || !int.TryParse(userIdValue.ToString(), out var userId))
            {
                return null;
            }

            var userName = dict.TryGetValue("userName", out var userNameValue)
                ? userNameValue.ToString()
                : null;

            var identityIconUrl = dict.TryGetValue("identityIconUrl", out var iconValue)
                ? iconValue.ToString()
                : null;

            var connectionId = dict.TryGetValue("connectionId", out var connectionValue)
                ? connectionValue.ToString()
                : null;

            if (userName == null || string.IsNullOrEmpty(connectionId))
            {
                return null;
            }

            return new ItemEditor(userId, userName, string.IsNullOrEmpty(identityIconUrl) ? null : identityIconUrl, connectionId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalRPresence: Failed to parse item editor for ItemId={ItemId}", itemId);
            return null;
        }
    }

    /// <summary>
    /// 接続が編集中のアイテムIDを取得する。
    /// </summary>
    public async Task<int?> GetConnectionEditingItemIdAsync(string connectionId)
    {
        var connectionKey = $"{ItemEditorConnectionPrefix}{connectionId}";
        var value = await _db.StringGetAsync(connectionKey);
        if (value.IsNullOrEmpty) return null;
        return int.TryParse(value.ToString(), out var itemId) ? itemId : null;
    }

    // ========================================
    // ワークスペース編集状態管理（Hash ベース）
    // ========================================

    public async Task SetWorkspaceEditorAsync(int workspaceId, int userId, string userName, string? identityIconUrl, string connectionId)
    {
        var editorKey = $"{WorkspaceEditorPrefix}{workspaceId}";
        var connectionKey = $"{WorkspaceEditorConnectionPrefix}{connectionId}";

        var entries = new HashEntry[]
        {
            new("userId", userId),
            new("userName", userName),
            new("identityIconUrl", identityIconUrl ?? string.Empty),
            new("connectionId", connectionId)
        };

        await _db.HashSetAsync(editorKey, entries);
        await _db.StringSetAsync(connectionKey, workspaceId.ToString(), ConnectionTtl);
        await _db.KeyExpireAsync(editorKey, ConnectionTtl);
    }

    public async Task RemoveWorkspaceEditorAsync(int workspaceId, string connectionId)
    {
        var editor = await GetWorkspaceEditorAsync(workspaceId);
        if (editor == null)
        {
            return;
        }

        if (!string.Equals(editor.ConnectionId, connectionId, StringComparison.Ordinal))
        {
            _logger.LogDebug(
                "SignalRPresence: Skip removing workspace editor because connectionId mismatch. WorkspaceId={WorkspaceId}, Expected={Expected}, Actual={Actual}",
                workspaceId, editor.ConnectionId, connectionId);
            return;
        }

        var editorKey = $"{WorkspaceEditorPrefix}{workspaceId}";
        await _db.KeyDeleteAsync(editorKey);

        var connectionKey = $"{WorkspaceEditorConnectionPrefix}{connectionId}";
        var mappedWorkspaceId = await GetConnectionEditingWorkspaceIdAsync(connectionId);
        if (mappedWorkspaceId.HasValue && mappedWorkspaceId.Value == workspaceId)
        {
            await _db.KeyDeleteAsync(connectionKey);
        }
    }

    public async Task<ItemEditor?> GetWorkspaceEditorAsync(int workspaceId)
    {
        var editorKey = $"{WorkspaceEditorPrefix}{workspaceId}";
        var entries = await _db.HashGetAllAsync(editorKey);
        if (entries == null || entries.Length == 0)
        {
            return null;
        }

        try
        {
            var dict = entries.ToDictionary(x => x.Name.ToString(), x => x.Value);

            if (!dict.TryGetValue("userId", out var userIdValue) || !int.TryParse(userIdValue.ToString(), out var userId))
            {
                return null;
            }

            var userName = dict.TryGetValue("userName", out var userNameValue)
                ? userNameValue.ToString()
                : null;

            var identityIconUrl = dict.TryGetValue("identityIconUrl", out var iconValue)
                ? iconValue.ToString()
                : null;

            var connectionId = dict.TryGetValue("connectionId", out var connectionValue)
                ? connectionValue.ToString()
                : null;

            if (userName == null || string.IsNullOrEmpty(connectionId))
            {
                return null;
            }

            return new ItemEditor(userId, userName, string.IsNullOrEmpty(identityIconUrl) ? null : identityIconUrl, connectionId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalRPresence: Failed to parse workspace editor for WorkspaceId={WorkspaceId}", workspaceId);
            return null;
        }
    }

    public async Task<int?> GetConnectionEditingWorkspaceIdAsync(string connectionId)
    {
        var connectionKey = $"{WorkspaceEditorConnectionPrefix}{connectionId}";
        var value = await _db.StringGetAsync(connectionKey);
        if (value.IsNullOrEmpty) return null;
        return int.TryParse(value.ToString(), out var workspaceId) ? workspaceId : null;
    }

    // ========================================
    // 組織管理（Set ベース）
    // ========================================

    /// <summary>
    /// 組織に接続を追加
    /// </summary>
    public async Task AddConnectionToOrganizationAsync(string connectionId, int organizationId)
    {
        var orgKey = $"{ConnectionOrganizationPrefix}{connectionId}";
        var orgConnsKey = $"{OrganizationConnectionsPrefix}{organizationId}";

        await _db.StringSetAsync(orgKey, organizationId.ToString(), ConnectionTtl);
        await _db.SetAddAsync(orgConnsKey, connectionId);
        await _db.KeyExpireAsync(orgConnsKey, ConnectionTtl);
    }

    /// <summary>
    /// 組織から接続を削除
    /// </summary>
    public async Task RemoveConnectionFromOrganizationAsync(string connectionId, int organizationId)
    {
        var orgKey = $"{ConnectionOrganizationPrefix}{connectionId}";
        var orgConnsKey = $"{OrganizationConnectionsPrefix}{organizationId}";

        await _db.KeyDeleteAsync(orgKey);
        await _db.SetRemoveAsync(orgConnsKey, connectionId);
    }

    /// <summary>
    /// 接続の現在の組織IDを取得
    /// </summary>
    public async Task<int?> GetConnectionOrganizationAsync(string connectionId)
    {
        var key = $"{ConnectionOrganizationPrefix}{connectionId}";
        var value = await _db.StringGetAsync(key);
        if (value.IsNullOrEmpty) return null;
        return int.TryParse(value.ToString(), out var orgId) ? orgId : null;
    }

    /// <summary>
    /// 組織に参加中のユーザーID一覧を取得（指定した接続を除く）
    /// </summary>
    public async Task<List<int>> GetOrganizationUserIdsAsync(int organizationId, string? excludeConnectionId = null)
    {
        var orgConnsKey = $"{OrganizationConnectionsPrefix}{organizationId}";
        var connectionIds = await _db.SetMembersAsync(orgConnsKey);

        var userIds = new HashSet<int>();
        foreach (var connId in connectionIds)
        {
            if (connId.IsNullOrEmpty) continue;
            var connectionIdStr = connId.ToString();

            if (excludeConnectionId != null && connectionIdStr == excludeConnectionId) continue;

            var userId = await GetConnectionUserIdAsync(connectionIdStr);
            if (userId.HasValue)
            {
                userIds.Add(userId.Value);
            }
        }

        return [.. userIds];
    }
}