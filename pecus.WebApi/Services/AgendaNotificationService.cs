using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.Agenda;

namespace Pecus.Services;

/// <summary>
/// アジェンダ通知サービス
/// </summary>
public class AgendaNotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AgendaNotificationService> _logger;

    public AgendaNotificationService(ApplicationDbContext context, ILogger<AgendaNotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 通知一覧取得（ページング対応）
    /// </summary>
    public async Task<List<AgendaNotificationResponse>> GetListAsync(
        int organizationId,
        int userId,
        int limit = 50,
        long? beforeId = null,
        bool unreadOnly = false)
    {
        var query = _context.AgendaNotifications
            .AsNoTracking()
            .Include(n => n.Agenda)
            .Include(n => n.CreatedByUser)
            .Where(n => n.UserId == userId && n.Agenda!.OrganizationId == organizationId);

        if (unreadOnly)
        {
            query = query.Where(n => !n.IsRead);
        }

        if (beforeId.HasValue)
        {
            query = query.Where(n => n.Id < beforeId.Value);
        }

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Take(limit)
            .ToListAsync();

        return notifications.Select(ToResponse).ToList();
    }

    /// <summary>
    /// 通知件数取得（ヘッダーバッジ用）
    /// </summary>
    /// <remarks>
    /// 未読通知数のみを返します。
    /// 招待通知はAgendaNotificationsテーブルにInvitedタイプとして保存されているため、
    /// PendingInvitations（AgendaAttendeesのPending状態）を別途カウントすると二重カウントになります。
    /// </remarks>
    public async Task<AgendaNotificationCountResponse> GetCountAsync(int organizationId, int userId)
    {
        // 未読通知数（招待通知も含む）
        var unreadCount = await _context.AgendaNotifications
            .AsNoTracking()
            .Include(n => n.Agenda)
            .Where(n => n.UserId == userId && n.Agenda!.OrganizationId == organizationId && !n.IsRead)
            .CountAsync();

        return new AgendaNotificationCountResponse
        {
            PendingInvitations = 0, // 招待通知はAgendaNotificationsに含まれるため0
            UnreadNotifications = unreadCount
        };
    }

    /// <summary>
    /// 通知を既読にする
    /// </summary>
    public async Task MarkAsReadAsync(int organizationId, int userId, long notificationId)
    {
        var notification = await _context.AgendaNotifications
            .Include(n => n.Agenda)
            .FirstOrDefaultAsync(n =>
                n.Id == notificationId &&
                n.UserId == userId &&
                n.Agenda!.OrganizationId == organizationId);

        if (notification == null)
            throw new NotFoundException("通知が見つかりません。");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// 複数の通知を一括既読にする
    /// </summary>
    public async Task<int> MarkMultipleAsReadAsync(int organizationId, int userId, List<long>? notificationIds)
    {
        var query = _context.AgendaNotifications
            .Include(n => n.Agenda)
            .Where(n =>
                n.UserId == userId &&
                n.Agenda!.OrganizationId == organizationId &&
                !n.IsRead);

        // 特定のIDが指定されている場合はそれのみ対象
        if (notificationIds != null && notificationIds.Count > 0)
        {
            query = query.Where(n => notificationIds.Contains(n.Id));
        }

        var notifications = await query.ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();

        return notifications.Count;
    }

    /// <summary>
    /// 通知を作成（内部用）
    /// </summary>
    public async Task CreateNotificationAsync(
        long agendaId,
        int userId,
        AgendaNotificationType type,
        DateTimeOffset? occurrenceStartAt = null,
        string? message = null,
        int? createdByUserId = null)
    {
        var notification = new AgendaNotification
        {
            AgendaId = agendaId,
            UserId = userId,
            Type = type,
            OccurrenceStartAt = occurrenceStartAt,
            Message = message,
            IsRead = false,
            IsEmailSent = false,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.AgendaNotifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// 複数ユーザーに一括通知を作成（内部用）
    /// </summary>
    public async Task CreateBulkNotificationsAsync(
        long agendaId,
        List<int> userIds,
        AgendaNotificationType type,
        DateTimeOffset? occurrenceStartAt = null,
        string? message = null,
        int? createdByUserId = null)
    {
        var now = DateTimeOffset.UtcNow;
        var notifications = userIds.Select(userId => new AgendaNotification
        {
            AgendaId = agendaId,
            UserId = userId,
            Type = type,
            OccurrenceStartAt = occurrenceStartAt,
            Message = message,
            IsRead = false,
            IsEmailSent = false,
            CreatedByUserId = createdByUserId,
            CreatedAt = now
        }).ToList();

        _context.AgendaNotifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Created {Count} notifications for agenda {AgendaId}, type: {Type}",
            notifications.Count, agendaId, type);
    }

    private AgendaNotificationResponse ToResponse(AgendaNotification notification)
    {
        return new AgendaNotificationResponse
        {
            Id = notification.Id,
            AgendaId = notification.AgendaId,
            AgendaTitle = notification.Agenda?.Title ?? "",
            Type = notification.Type,
            OccurrenceStartAt = notification.OccurrenceStartAt,
            Message = notification.Message,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            CreatedByUser = notification.CreatedByUser == null ? null : ToUserItem(notification.CreatedByUser)
        };
    }

    private UserItem ToUserItem(Libs.DB.Models.User user)
    {
        return new UserItem
        {
            Id = user.Id,
            LoginId = user.LoginId,
            Username = user.Username,
            Email = user.Email,
            AvatarType = user.AvatarType?.ToString() ?? "auto-generated",
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(user.AvatarType, user.Id, user.Username, user.Email, user.UserAvatarPath),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            RoleCount = 0
        };
    }
}
