using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;
using System.Text.Json;
using BotEntity = Pecus.Libs.DB.Models.Bot;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// SystemNotificationテーブルの通知を配信するHangfireタスク
/// BackOfficeで登録された通知をPublishAt日時になったら全組織のシステムチャットルームに配信する
/// </summary>
public class SystemNotificationDeliveryTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<SystemNotificationDeliveryTask> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public SystemNotificationDeliveryTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<SystemNotificationDeliveryTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
    }

    /// <summary>
    /// 未配信のシステム通知を処理する
    /// </summary>
    public async Task ProcessPendingNotificationsAsync()
    {
        var now = DateTimeOffset.UtcNow;

        var pendingNotifications = await _context.SystemNotifications
            .Where(n => !n.IsProcessed && !n.IsDeleted && n.PublishAt <= now)
            .OrderBy(n => n.PublishAt)
            .ToListAsync();

        if (pendingNotifications.Count == 0)
        {
            _logger.LogDebug("配信待ちのシステム通知はありません");
            return;
        }

        _logger.LogInformation(
            "配信待ちのシステム通知が{Count}件見つかりました",
            pendingNotifications.Count);

        foreach (var notification in pendingNotifications)
        {
            try
            {
                await ProcessNotificationAsync(notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "システム通知の配信に失敗しました: NotificationId={NotificationId}, Subject={Subject}",
                    notification.Id,
                    notification.Subject);
            }
        }
    }

    private async Task ProcessNotificationAsync(SystemNotification notification)
    {
        _logger.LogInformation(
            "システム通知を配信開始: NotificationId={NotificationId}, Subject={Subject}, Type={Type}",
            notification.Id,
            notification.Subject,
            notification.Type);

        var messageIds = await SendToAllOrganizationsAsync(notification);

        notification.IsProcessed = true;
        notification.ProcessedAt = DateTimeOffset.UtcNow;
        notification.MessageIds = JsonSerializer.Serialize(messageIds);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "システム通知の配信完了: NotificationId={NotificationId}, MessageCount={MessageCount}",
            notification.Id,
            messageIds.Count);
    }

    private async Task<List<int>> SendToAllOrganizationsAsync(SystemNotification notification)
    {
        var messageIds = new List<int>();

        var organizationIds = await _context.Organizations
            .AsNoTracking()
            .Select(o => o.Id)
            .ToListAsync();

        _logger.LogInformation(
            "{Count}組織に通知を配信します",
            organizationIds.Count);

        foreach (var organizationId in organizationIds)
        {
            try
            {
                var messageId = await SendToOrganizationAsync(organizationId, notification);
                if (messageId.HasValue)
                {
                    messageIds.Add(messageId.Value);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "組織への通知配信に失敗しました: OrganizationId={OrganizationId}",
                    organizationId);
            }
        }

        return messageIds;
    }

    private async Task<int?> SendToOrganizationAsync(int organizationId, SystemNotification notification)
    {
        var systemRoom = await GetOrCreateSystemRoomAsync(organizationId);
        if (systemRoom == null)
        {
            _logger.LogWarning(
                "システムルームを作成できませんでした: OrganizationId={OrganizationId}",
                organizationId);
            return null;
        }

        var systemBot = await GetSystemBotAsync(organizationId);
        if (systemBot?.ChatActor == null)
        {
            _logger.LogWarning(
                "SystemBotが見つかりませんでした: OrganizationId={OrganizationId}",
                organizationId);
            return null;
        }

        await EnsureBotIsMemberAsync(systemRoom.Id, systemBot.ChatActor.Id);

        var messageContent = BuildMessageContent(notification);
        var messageId = await SendBotMessageToSystemRoomAsync(
            organizationId,
            systemRoom,
            systemBot,
            messageContent);

        _logger.LogDebug(
            "通知を配信しました: OrganizationId={OrganizationId}, RoomId={RoomId}, MessageId={MessageId}",
            organizationId,
            systemRoom.Id,
            messageId);

        return messageId;
    }

    private async Task<ChatRoom?> GetOrCreateSystemRoomAsync(int organizationId)
    {
        var room = await _context.ChatRooms
            .FirstOrDefaultAsync(r =>
                r.OrganizationId == organizationId &&
                r.WorkspaceId == null &&
                r.Type == ChatRoomType.System);

        if (room != null)
        {
            return room;
        }

        var firstUser = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync();

        if (firstUser == null)
        {
            return null;
        }

        var organizationUserIds = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        var actors = await _context.ChatActors
            .Where(a => a.UserId != null && organizationUserIds.Contains(a.UserId.Value))
            .ToListAsync();

        room = new ChatRoom
        {
            Type = ChatRoomType.System,
            Name = "システム通知",
            OrganizationId = organizationId,
            CreatedByUserId = firstUser.Id,
            Members = actors
                .Select(actor => new ChatRoomMember
                {
                    ChatActorId = actor.Id,
                    Role = actor.UserId == firstUser.Id ? ChatRoomRole.Owner : ChatRoomRole.Member,
                })
                .ToList(),
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "システムルームを作成しました: RoomId={RoomId}, OrganizationId={OrganizationId}",
            room.Id,
            organizationId);

        return room;
    }

    private async Task<BotEntity?> GetSystemBotAsync(int organizationId)
    {
        return await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == BotType.SystemBot);
    }

    private async Task EnsureBotIsMemberAsync(int roomId, int chatActorId)
    {
        var isMember = await _context.ChatRoomMembers.AnyAsync(m =>
            m.ChatRoomId == roomId && m.ChatActorId == chatActorId);

        if (!isMember)
        {
            _context.ChatRoomMembers.Add(new ChatRoomMember
            {
                ChatRoomId = roomId,
                ChatActorId = chatActorId,
                Role = ChatRoomRole.Member,
            });
            await _context.SaveChangesAsync();
        }
    }

    private async Task<int> SendBotMessageToSystemRoomAsync(
        int organizationId,
        ChatRoom room,
        BotEntity systemBot,
        string content)
    {
        var message = new ChatMessage
        {
            ChatRoomId = room.Id,
            SenderActorId = systemBot.ChatActor!.Id,
            MessageType = ChatMessageType.System,
            Content = content,
        };
        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        await _context.ChatRooms
            .Where(r => r.Id == room.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));

        var payload = new
        {
            RoomId = room.Id,
            RoomType = room.Type.ToString(),
            Message = new
            {
                message.Id,
                message.SenderActorId,
                MessageType = message.MessageType.ToString(),
                message.Content,
                message.CreatedAt,
            },
        };

        await _publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:system_message",
            Payload = payload,
            SourceType = NotificationSourceType.SystemBot,
            OrganizationId = organizationId,
        });

        return message.Id;
    }

    private static string BuildMessageContent(SystemNotification notification)
    {
        var categoryLabel = GetCategoryLabel(notification.Type);
        return $"【{categoryLabel}】{notification.Subject}\n\n{notification.Body}";
    }

    private static string GetCategoryLabel(SystemNotificationType? type)
    {
        return type switch
        {
            SystemNotificationType.EmergencyMaintenance => "緊急メンテナンス",
            SystemNotificationType.ScheduledMaintenance => "定期メンテナンス",
            SystemNotificationType.Important => "重要",
            SystemNotificationType.Info => "お知らせ",
            SystemNotificationType.IncidentReport => "障害報告",
            _ => "お知らせ",
        };
    }
}