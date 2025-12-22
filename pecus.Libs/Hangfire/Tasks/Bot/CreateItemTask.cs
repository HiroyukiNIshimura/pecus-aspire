using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム作成時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class CreateItemTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<CreateItemTask> _logger;

    /// <summary>
    /// CreateItemTask のコンストラクタ
    /// </summary>
    public CreateItemTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<CreateItemTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
    }

    /// <summary>
    /// アイテム作成時のメッセージ通知を実行する
    /// </summary>
    /// <param name="itemId">作成されたアイテムのID</param>
    public async Task NotifyItemCreatedAsync(int itemId)
    {
        _logger.LogDebug(
            "CreateItemTask started: ItemId={ItemId}",
            itemId
        );

        try
        {
            // 1. アイテムを取得（Workspace と Owner を含む）
            var item = await _context.WorkspaceItems
                .Include(i => i.Workspace)
                .Include(i => i.Owner)
                .FirstOrDefaultAsync(i => i.Id == itemId);

            if (item == null)
            {
                _logger.LogWarning(
                    "WorkspaceItem not found: ItemId={ItemId}",
                    itemId
                );
                return;
            }

            if (item.Workspace == null)
            {
                _logger.LogWarning(
                    "Workspace not found for item: ItemId={ItemId}",
                    itemId
                );
                return;
            }

            var organizationId = item.Workspace.OrganizationId;
            var workspaceCode = item.Workspace.Code ?? item.Workspace.Name;
            var itemCode = item.Code;
            var ownerName = item.Owner?.Username ?? "不明なユーザー";

            // 2. ワークスペースのグループチャットルームを取得
            var room = await _context.ChatRooms.FirstOrDefaultAsync(r =>
                r.WorkspaceId == item.WorkspaceId && r.Type == ChatRoomType.Group);

            if (room == null)
            {
                _logger.LogDebug(
                    "Workspace group chat room not found: WorkspaceId={WorkspaceId}",
                    item.WorkspaceId
                );
                return;
            }

            // 3. SystemBot を取得
            var systemBot = await GetSystemBotAsync(organizationId);
            if (systemBot?.ChatActor == null)
            {
                _logger.LogWarning(
                    "SystemBot not found for organization: OrganizationId={OrganizationId}",
                    organizationId
                );
                return;
            }

            // 4. SystemBot がルームのメンバーか確認し、メンバーでなければ追加
            await EnsureBotIsMemberAsync(room.Id, systemBot.ChatActor.Id);

            // 5. TODO: メッセージ作成が必要か判定（現在は常に作成）

            // 6. メッセージを作成してグループチャットに送信
            var messageContent = $"{ownerName}さんがアイテムを作成しました。\n[{workspaceCode}#{itemCode}]";
            await SendBotMessageAsync(organizationId, room, systemBot, messageContent);

            _logger.LogDebug(
                "CreateItemTask completed: ItemId={ItemId}, RoomId={RoomId}",
                itemId,
                room.Id
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "CreateItemTask failed: ItemId={ItemId}",
                itemId
            );
            throw;
        }
    }

    /// <summary>
    /// SystemBot を取得する
    /// </summary>
    private async Task<DB.Models.Bot?> GetSystemBotAsync(int organizationId)
    {
        return await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == BotType.SystemBot);
    }

    /// <summary>
    /// Bot がルームのメンバーであることを確認し、メンバーでなければ追加する
    /// </summary>
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

            _logger.LogInformation(
                "SystemBot added to room: RoomId={RoomId}, ChatActorId={ChatActorId}",
                roomId,
                chatActorId
            );
        }
    }

    /// <summary>
    /// Bot メッセージを保存して SignalR 通知を送信する
    /// </summary>
    private async Task SendBotMessageAsync(
        int organizationId,
        ChatRoom room,
        DB.Models.Bot systemBot,
        string content)
    {
        // メッセージを作成
        var message = new ChatMessage
        {
            ChatRoomId = room.Id,
            SenderActorId = systemBot.ChatActor!.Id,
            MessageType = ChatMessageType.Text,
            Content = content,
        };
        _context.ChatMessages.Add(message);

        // ルームの UpdatedAt を更新
        room.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        // SignalR 通知を送信（Redis Pub/Sub 経由）
        var payload = new
        {
            RoomId = room.Id,
            RoomType = room.Type.ToString(),
            Message = new
            {
                message.Id,
                SenderActorId = systemBot.ChatActor.Id,
                message.MessageType,
                message.Content,
                message.ReplyToMessageId,
                message.CreatedAt,
                Sender = new
                {
                    Id = systemBot.ChatActor.Id,
                    ActorType = systemBot.ChatActor.ActorType.ToString(),
                    UserId = (int?)null,
                    BotId = systemBot.Id,
                    DisplayName = systemBot.Name,
                    AvatarType = systemBot.ChatActor.AvatarType?.ToString()?.ToLowerInvariant(),
                    AvatarUrl = systemBot.IconUrl,
                    IdentityIconUrl = systemBot.IconUrl ?? "",
                    IsActive = true,
                },
            },
        };

        // チャットルームグループに通知
        var receiverCount = await _publisher.PublishChatBotNotificationAsync(
            organizationId,
            room.Id,
            "chat:message_received",
            payload
        );

        _logger.LogDebug(
            "SystemBot message sent: RoomId={RoomId}, MessageId={MessageId}, Receivers={ReceiverCount}",
            room.Id,
            message.Id,
            receiverCount
        );

        // organization グループに未読バッジ更新を通知
        await _publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:unread_updated",
            Payload = new
            {
                RoomId = room.Id,
                RoomType = room.Type.ToString(),
                SenderActorId = systemBot.ChatActor.Id,
            },
            SourceType = NotificationSourceType.ChatBot,
            OrganizationId = organizationId,
        });
    }
}