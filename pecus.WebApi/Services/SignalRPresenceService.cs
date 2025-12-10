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
    private const string ConnectionUserPrefix = "presence:conn_user:";     // ConnectionId → UserId
    private const string ConnectionWorkspacePrefix = "presence:conn_ws:";  // ConnectionId → WorkspaceId
    private const string ConnectionItemPrefix = "presence:conn_item:";     // ConnectionId → ItemId
    private const string WorkspaceConnectionsPrefix = "presence:ws_conns:"; // WorkspaceId → Set<ConnectionId>

    public SignalRPresenceService(IConnectionMultiplexer redis, ILogger<SignalRPresenceService> logger)
    {
        _db = redis.GetDatabase(DatabaseNumber);
        _logger = logger;
    }

    /// <summary>
    /// 接続時にユーザーIDを登録
    /// </summary>
    public async Task RegisterConnectionAsync(string connectionId, int userId)
    {
        var key = $"{ConnectionUserPrefix}{connectionId}";
        await _db.StringSetAsync(key, userId.ToString(), ConnectionTtl);
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

        // 接続情報を削除
        var userKey = $"{ConnectionUserPrefix}{connectionId}";
        var wsKey = $"{ConnectionWorkspacePrefix}{connectionId}";
        var itemKey = $"{ConnectionItemPrefix}{connectionId}";
        await _db.KeyDeleteAsync([userKey, wsKey, itemKey]);
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
        var key = $"{ConnectionItemPrefix}{connectionId}";
        await _db.KeyDeleteAsync(key);
    }
}
