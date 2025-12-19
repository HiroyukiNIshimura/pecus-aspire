using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Hubs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Services;

/// <summary>
/// チャットルーム管理サービス
/// </summary>
public class ChatRoomService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<ChatRoomService> _logger;

    public ChatRoomService(
        ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext,
        ILogger<ChatRoomService> logger
    )
    {
        _context = context;
        _hubContext = hubContext;
        _logger = logger;
    }

    #region DM ルーム

    /// <summary>
    /// DM 用のユーザーペア文字列を生成
    /// </summary>
    private static string GenerateDmUserPair(int userId1, int userId2)
    {
        var min = Math.Min(userId1, userId2);
        var max = Math.Max(userId1, userId2);
        return $"{min}_{max}";
    }

    /// <summary>
    /// DM ルームを取得または作成
    /// </summary>
    /// <param name="currentUserId">現在のユーザーID</param>
    /// <param name="targetUserId">相手ユーザーID</param>
    /// <param name="organizationId">組織ID</param>
    /// <returns>DM ルーム</returns>
    public async Task<ChatRoom> GetOrCreateDmRoomAsync(
        int currentUserId,
        int targetUserId,
        int organizationId
    )
    {
        if (currentUserId == targetUserId)
        {
            throw new BadRequestException("自分自身とDMを作成することはできません。");
        }

        var dmUserPair = GenerateDmUserPair(currentUserId, targetUserId);

        // 既存のDMルームを検索
        var existingRoom = await _context
            .ChatRooms.Include(r => r.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r =>
                r.OrganizationId == organizationId
                && r.Type == ChatRoomType.Dm
                && r.DmUserPair == dmUserPair
            );

        if (existingRoom != null)
        {
            return existingRoom;
        }

        // 相手ユーザーの存在確認
        var targetUser = await _context.Users.FindAsync(targetUserId);
        if (targetUser == null || targetUser.OrganizationId != organizationId)
        {
            throw new NotFoundException("指定されたユーザーが見つかりません。");
        }

        // 新規作成
        var room = new ChatRoom
        {
            Type = ChatRoomType.Dm,
            OrganizationId = organizationId,
            DmUserPair = dmUserPair,
            CreatedByUserId = currentUserId,
            Members = new List<ChatRoomMember>
            {
                new() { UserId = currentUserId, Role = ChatRoomRole.Member },
                new() { UserId = targetUserId, Role = ChatRoomRole.Member },
            },
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        // Navigation Property を読み込み
        await _context.Entry(room).Collection(r => r.Members).LoadAsync();
        foreach (var member in room.Members)
        {
            await _context.Entry(member).Reference(m => m.User).LoadAsync();
        }

        _logger.LogInformation(
            "DM room created: RoomId={RoomId}, Users={User1},{User2}",
            room.Id,
            currentUserId,
            targetUserId
        );

        return room;
    }

    #endregion

    #region グループ/システム ルーム

    /// <summary>
    /// 組織のグループチャットルームを取得または作成
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="createdByUserId">作成者ユーザーID</param>
    /// <returns>グループチャットルーム</returns>
    public async Task<ChatRoom> GetOrCreateGroupRoomAsync(int organizationId, int createdByUserId)
    {
        return await GetOrCreateOrganizationRoomAsync(
            organizationId,
            createdByUserId,
            ChatRoomType.Group,
            "グループチャット"
        );
    }

    /// <summary>
    /// ワークスペースのグループチャットルームを取得または作成
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="createdByUserId">作成者ユーザーID</param>
    /// <returns>ワークスペースグループチャットルーム</returns>
    public async Task<ChatRoom> GetOrCreateWorkspaceGroupRoomAsync(
        int workspaceId,
        int createdByUserId
    )
    {
        // ワークスペース情報を取得
        var workspace = await _context
            .Workspaces.Include(w => w.WorkspaceUsers)
            .FirstOrDefaultAsync(w => w.Id == workspaceId);

        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // 既存のワークスペースグループルームを検索
        var existingRoom = await _context
            .ChatRooms.Include(r => r.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r =>
                r.OrganizationId == workspace.OrganizationId
                && r.WorkspaceId == workspaceId
                && r.Type == ChatRoomType.Group
            );

        if (existingRoom != null)
        {
            return existingRoom;
        }

        // ワークスペースのメンバーを取得
        var workspaceUserIds = workspace.WorkspaceUsers.Select(wu => wu.UserId).ToList();

        // 新規作成
        var room = new ChatRoom
        {
            Type = ChatRoomType.Group,
            Name = $"{workspace.Name} グループチャット",
            OrganizationId = workspace.OrganizationId,
            WorkspaceId = workspaceId,
            CreatedByUserId = createdByUserId,
            Members = workspaceUserIds
                .Select(userId => new ChatRoomMember
                {
                    UserId = userId,
                    Role = userId == createdByUserId ? ChatRoomRole.Owner : ChatRoomRole.Member,
                })
                .ToList(),
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        // Navigation Property を読み込み
        await _context.Entry(room).Collection(r => r.Members).LoadAsync();
        foreach (var member in room.Members)
        {
            await _context.Entry(member).Reference(m => m.User).LoadAsync();
        }

        _logger.LogInformation(
            "Workspace group room created: RoomId={RoomId}, WorkspaceId={WorkspaceId}, OrganizationId={OrganizationId}",
            room.Id,
            workspaceId,
            workspace.OrganizationId
        );

        return room;
    }

    /// <summary>
    /// 組織のシステム通知ルームを取得または作成
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="createdByUserId">作成者ユーザーID</param>
    /// <returns>システム通知ルーム</returns>
    public async Task<ChatRoom> GetOrCreateSystemRoomAsync(int organizationId, int createdByUserId)
    {
        return await GetOrCreateOrganizationRoomAsync(
            organizationId,
            createdByUserId,
            ChatRoomType.System,
            "システム通知"
        );
    }

    /// <summary>
    /// 組織単位のルーム（Group/System）を取得または作成
    /// WorkspaceId が null のルーム（組織全体のグループ/システムルーム）を対象
    /// </summary>
    private async Task<ChatRoom> GetOrCreateOrganizationRoomAsync(
        int organizationId,
        int createdByUserId,
        ChatRoomType type,
        string defaultName
    )
    {
        // 既存のルームを検索（WorkspaceId が null の組織全体のルーム）
        var existingRoom = await _context
            .ChatRooms.Include(r => r.Members)
            .FirstOrDefaultAsync(r =>
                r.OrganizationId == organizationId && r.WorkspaceId == null && r.Type == type
            );

        if (existingRoom != null)
        {
            return existingRoom;
        }

        // 組織の全ユーザーを取得
        var organizationUsers = await _context
            .Users.Where(u => u.OrganizationId == organizationId && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        // 新規作成
        var room = new ChatRoom
        {
            Type = type,
            Name = defaultName,
            OrganizationId = organizationId,
            CreatedByUserId = createdByUserId,
            Members = organizationUsers
                .Select(userId => new ChatRoomMember
                {
                    UserId = userId,
                    Role = userId == createdByUserId ? ChatRoomRole.Owner : ChatRoomRole.Member,
                })
                .ToList(),
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "{RoomType} room created: RoomId={RoomId}, OrganizationId={OrganizationId}",
            type,
            room.Id,
            organizationId
        );

        return room;
    }

    #endregion

    #region AI ルーム

    /// <summary>
    /// AI チャットルームを取得または作成
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="organizationId">組織ID</param>
    /// <returns>AI チャットルーム</returns>
    public async Task<ChatRoom> GetOrCreateAiRoomAsync(int userId, int organizationId)
    {
        // 既存の AI ルームを検索
        var existingRoom = await _context
            .ChatRooms.Include(r => r.Members)
            .FirstOrDefaultAsync(r =>
                r.OrganizationId == organizationId
                && r.Type == ChatRoomType.Ai
                && r.Members.Any(m => m.UserId == userId)
            );

        if (existingRoom != null)
        {
            return existingRoom;
        }

        // 新規作成
        var room = new ChatRoom
        {
            Type = ChatRoomType.Ai,
            Name = "AI アシスタント",
            OrganizationId = organizationId,
            CreatedByUserId = userId,
            Members = new List<ChatRoomMember>
            {
                new() { UserId = userId, Role = ChatRoomRole.Owner },
            },
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "AI room created: RoomId={RoomId}, UserId={UserId}",
            room.Id,
            userId
        );

        return room;
    }

    #endregion

    #region ルーム取得

    /// <summary>
    /// ルームIDでルームを取得
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <returns>チャットルーム</returns>
    public async Task<ChatRoom?> GetRoomByIdAsync(int roomId)
    {
        return await _context
            .ChatRooms.Include(r => r.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == roomId);
    }

    /// <summary>
    /// ユーザーが参加しているルーム一覧を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="organizationId">組織ID</param>
    /// <param name="type">ルームタイプ（指定しない場合は全タイプ）</param>
    /// <returns>ルーム一覧</returns>
    public async Task<List<ChatRoom>> GetUserRoomsAsync(
        int userId,
        int organizationId,
        ChatRoomType? type = null
    )
    {
        var query = _context
            .ChatRooms.Include(r => r.Members)
            .ThenInclude(m => m.User)
            .Where(r =>
                r.OrganizationId == organizationId && r.Members.Any(m => m.UserId == userId)
            );

        if (type.HasValue)
        {
            query = query.Where(r => r.Type == type.Value);
        }

        return await query.OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt).ToListAsync();
    }

    /// <summary>
    /// ユーザーがルームのメンバーかどうか確認
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="userId">ユーザーID</param>
    /// <returns>メンバーの場合 true</returns>
    public async Task<bool> IsRoomMemberAsync(int roomId, int userId)
    {
        return await _context.ChatRoomMembers.AnyAsync(m =>
            m.ChatRoomId == roomId && m.UserId == userId
        );
    }

    /// <summary>
    /// ユーザーのルームメンバー情報を取得
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="userId">ユーザーID</param>
    /// <returns>ルームメンバー情報</returns>
    public async Task<ChatRoomMember?> GetRoomMemberAsync(int roomId, int userId)
    {
        return await _context.ChatRoomMembers.FirstOrDefaultAsync(m =>
            m.ChatRoomId == roomId && m.UserId == userId
        );
    }

    #endregion

    #region 既読管理

    /// <summary>
    /// 既読位置を更新
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="userId">ユーザーID</param>
    /// <param name="readAt">既読日時</param>
    public async Task UpdateLastReadAtAsync(int roomId, int userId, DateTimeOffset readAt)
    {
        var member = await _context.ChatRoomMembers.FirstOrDefaultAsync(m =>
            m.ChatRoomId == roomId && m.UserId == userId
        );

        if (member == null)
        {
            throw new NotFoundException("ルームメンバーが見つかりません。");
        }

        // 既読位置は前に戻さない
        if (member.LastReadAt == null || member.LastReadAt < readAt)
        {
            member.LastReadAt = readAt;
            await _context.SaveChangesAsync();

            // 既読通知を送信（ルームメンバーに通知）
            await SendReadNotificationAsync(roomId, userId, readAt);
        }
    }

    /// <summary>
    /// ルームの未読メッセージ数を取得
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="userId">ユーザーID</param>
    /// <returns>未読メッセージ数</returns>
    public async Task<int> GetUnreadCountAsync(int roomId, int userId)
    {
        var member = await _context.ChatRoomMembers.FirstOrDefaultAsync(m =>
            m.ChatRoomId == roomId && m.UserId == userId
        );

        if (member == null)
        {
            return 0;
        }

        var query = _context.ChatMessages.Where(m => m.ChatRoomId == roomId);

        if (member.LastReadAt.HasValue)
        {
            query = query.Where(m => m.CreatedAt > member.LastReadAt.Value);
        }

        return await query.CountAsync();
    }

    /// <summary>
    /// ユーザーの全ルームの未読メッセージ数を取得（Muted 除外）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="organizationId">組織ID</param>
    /// <returns>未読メッセージ数合計</returns>
    public async Task<int> GetTotalUnreadCountAsync(int userId, int organizationId)
    {
        var members = await _context
            .ChatRoomMembers.Include(m => m.ChatRoom)
            .Where(m =>
                m.UserId == userId
                && m.ChatRoom.OrganizationId == organizationId
                && m.NotificationSetting != ChatNotificationSetting.Muted
            )
            .ToListAsync();

        var totalUnread = 0;
        foreach (var member in members)
        {
            var query = _context.ChatMessages.Where(m => m.ChatRoomId == member.ChatRoomId);

            if (member.LastReadAt.HasValue)
            {
                query = query.Where(m => m.CreatedAt > member.LastReadAt.Value);
            }

            totalUnread += await query.CountAsync();
        }

        return totalUnread;
    }

    /// <summary>
    /// カテゴリ別の未読メッセージ数を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="organizationId">組織ID</param>
    /// <returns>カテゴリ別未読数</returns>
    public async Task<Dictionary<ChatRoomType, int>> GetUnreadCountByCategoryAsync(
        int userId,
        int organizationId
    )
    {
        var result = new Dictionary<ChatRoomType, int>
        {
            { ChatRoomType.Dm, 0 },
            { ChatRoomType.Group, 0 },
            { ChatRoomType.Ai, 0 },
            { ChatRoomType.System, 0 },
        };

        var members = await _context
            .ChatRoomMembers.Include(m => m.ChatRoom)
            .Where(m =>
                m.UserId == userId
                && m.ChatRoom.OrganizationId == organizationId
                && m.NotificationSetting != ChatNotificationSetting.Muted
            )
            .ToListAsync();

        foreach (var member in members)
        {
            var query = _context.ChatMessages.Where(m => m.ChatRoomId == member.ChatRoomId);

            if (member.LastReadAt.HasValue)
            {
                query = query.Where(m => m.CreatedAt > member.LastReadAt.Value);
            }

            var count = await query.CountAsync();
            result[member.ChatRoom.Type] += count;
        }

        return result;
    }

    #endregion

    #region 通知設定

    /// <summary>
    /// 通知設定を更新
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="userId">ユーザーID</param>
    /// <param name="setting">通知設定</param>
    public async Task UpdateNotificationSettingAsync(
        int roomId,
        int userId,
        ChatNotificationSetting setting
    )
    {
        var member = await _context.ChatRoomMembers.FirstOrDefaultAsync(m =>
            m.ChatRoomId == roomId && m.UserId == userId
        );

        if (member == null)
        {
            throw new NotFoundException("ルームメンバーが見つかりません。");
        }

        member.NotificationSetting = setting;
        await _context.SaveChangesAsync();
    }

    #endregion

    #region メンバー管理

    /// <summary>
    /// 組織に新規ユーザーが追加された際、Group/System ルームにメンバーを追加
    /// ワークスペースグループルーム（WorkspaceId != null）は対象外
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="organizationId">組織ID</param>
    public async Task AddUserToOrganizationRoomsAsync(int userId, int organizationId)
    {
        // 組織全体のルーム（WorkspaceId == null）のみ対象
        var rooms = await _context
            .ChatRooms.Where(r =>
                r.OrganizationId == organizationId
                && r.WorkspaceId == null
                && (r.Type == ChatRoomType.Group || r.Type == ChatRoomType.System)
            )
            .ToListAsync();

        foreach (var room in rooms)
        {
            var existingMember = await _context.ChatRoomMembers.AnyAsync(m =>
                m.ChatRoomId == room.Id && m.UserId == userId
            );

            if (!existingMember)
            {
                _context.ChatRoomMembers.Add(
                    new ChatRoomMember
                    {
                        ChatRoomId = room.Id,
                        UserId = userId,
                        Role = ChatRoomRole.Member,
                    }
                );
            }
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// ワークスペースに新規ユーザーが追加された際、ワークスペースグループルームにメンバーを追加
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    public async Task AddUserToWorkspaceRoomAsync(int userId, int workspaceId)
    {
        // ワークスペースのグループルームを検索
        var room = await _context.ChatRooms.FirstOrDefaultAsync(r =>
            r.WorkspaceId == workspaceId && r.Type == ChatRoomType.Group
        );

        // ルームが存在しない場合は何もしない（ルームが作成されていない場合）
        if (room == null)
        {
            return;
        }

        var existingMember = await _context.ChatRoomMembers.AnyAsync(m =>
            m.ChatRoomId == room.Id && m.UserId == userId
        );

        if (!existingMember)
        {
            _context.ChatRoomMembers.Add(
                new ChatRoomMember
                {
                    ChatRoomId = room.Id,
                    UserId = userId,
                    Role = ChatRoomRole.Member,
                }
            );
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "User added to workspace room: UserId={UserId}, WorkspaceId={WorkspaceId}, RoomId={RoomId}",
                userId,
                workspaceId,
                room.Id
            );
        }
    }

    /// <summary>
    /// ワークスペースからユーザーが削除された際、ワークスペースグループルームからメンバーを削除
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    public async Task RemoveUserFromWorkspaceRoomAsync(int userId, int workspaceId)
    {
        // ワークスペースのグループルームを検索
        var room = await _context.ChatRooms.FirstOrDefaultAsync(r =>
            r.WorkspaceId == workspaceId && r.Type == ChatRoomType.Group
        );

        if (room == null)
        {
            return;
        }

        var member = await _context.ChatRoomMembers.FirstOrDefaultAsync(m =>
            m.ChatRoomId == room.Id && m.UserId == userId
        );

        if (member != null)
        {
            _context.ChatRoomMembers.Remove(member);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "User removed from workspace room: UserId={UserId}, WorkspaceId={WorkspaceId}, RoomId={RoomId}",
                userId,
                workspaceId,
                room.Id
            );
        }
    }

    /// <summary>
    /// 組織からユーザーが削除された際、全ルームからメンバーを削除
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="organizationId">組織ID</param>
    public async Task RemoveUserFromOrganizationRoomsAsync(int userId, int organizationId)
    {
        var members = await _context
            .ChatRoomMembers.Include(m => m.ChatRoom)
            .Where(m => m.UserId == userId && m.ChatRoom.OrganizationId == organizationId)
            .ToListAsync();

        _context.ChatRoomMembers.RemoveRange(members);
        await _context.SaveChangesAsync();
    }

    #endregion

    #region SignalR 通知

    /// <summary>
    /// 既読通知を送信
    /// </summary>
    private async Task SendReadNotificationAsync(
        int roomId,
        int userId,
        DateTimeOffset readAt
    )
    {
        var groupName = $"chat:{roomId}";
        await _hubContext
            .Clients.Group(groupName)
            .SendAsync(
                "ReceiveNotification",
                new
                {
                    EventType = "chat:message_read",
                    Payload = new
                    {
                        RoomId = roomId,
                        UserId = userId,
                        ReadAt = readAt,
                    },
                    Timestamp = DateTimeOffset.UtcNow,
                }
            );
    }

    #endregion
}
