using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム関連の通知タスクの抽象基底クラス
/// 共通のメソッドを提供し、継承クラスで具体的な通知処理を実装する
/// </summary>
public abstract class ItemNotificationTaskBase
{
    /// <summary>
    /// データベースコンテキスト
    /// </summary>
    protected readonly ApplicationDbContext Context;

    /// <summary>
    /// SignalR 通知パブリッシャー
    /// </summary>
    protected readonly SignalRNotificationPublisher Publisher;

    /// <summary>
    /// ロガー
    /// </summary>
    protected readonly ILogger Logger;

    /// <summary>
    /// ItemNotificationTaskBase のコンストラクタ
    /// </summary>
    protected ItemNotificationTaskBase(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger logger)
    {
        Context = context;
        Publisher = publisher;
        Logger = logger;
    }

    /// <summary>
    /// アイテムを取得する（Workspace と Owner を含む）
    /// </summary>
    /// <param name="itemId">アイテムID</param>
    /// <returns>取得したアイテム、見つからない場合は null</returns>
    protected async Task<WorkspaceItem?> GetItemWithDetailsAsync(int itemId)
    {
        return await Context.WorkspaceItems
            .Include(i => i.Workspace)
            .Include(i => i.Owner)
            .FirstOrDefaultAsync(i => i.Id == itemId);
    }

    /// <summary>
    /// ワークスペースのグループチャットルームを取得する
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <returns>グループチャットルーム、見つからない場合は null</returns>
    protected async Task<ChatRoom?> GetWorkspaceGroupChatRoomAsync(int workspaceId)
    {
        return await Context.ChatRooms.FirstOrDefaultAsync(r =>
            r.WorkspaceId == workspaceId && r.Type == ChatRoomType.Group);
    }

    /// <summary>
    /// SystemBot を取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>SystemBot、見つからない場合は null</returns>
    protected async Task<DB.Models.Bot?> GetSystemBotAsync(int organizationId)
    {
        return await Context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == BotType.SystemBot);
    }

    /// <summary>
    /// Bot がルームのメンバーであることを確認し、メンバーでなければ追加する
    /// </summary>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="chatActorId">チャットアクターID</param>
    protected async Task EnsureBotIsMemberAsync(int roomId, int chatActorId)
    {
        var isMember = await Context.ChatRoomMembers.AnyAsync(m =>
            m.ChatRoomId == roomId && m.ChatActorId == chatActorId);

        if (!isMember)
        {
            Context.ChatRoomMembers.Add(new ChatRoomMember
            {
                ChatRoomId = roomId,
                ChatActorId = chatActorId,
                Role = ChatRoomRole.Member,
            });
            await Context.SaveChangesAsync();

            Logger.LogInformation(
                "SystemBot added to room: RoomId={RoomId}, ChatActorId={ChatActorId}",
                roomId,
                chatActorId
            );
        }
    }

    /// <summary>
    /// Bot メッセージを保存して SignalR 通知を送信する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="room">チャットルーム</param>
    /// <param name="systemBot">SystemBot</param>
    /// <param name="content">メッセージ内容</param>
    protected async Task SendBotMessageAsync(
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
        Context.ChatMessages.Add(message);

        // ルームの UpdatedAt を更新
        room.UpdatedAt = DateTimeOffset.UtcNow;

        await Context.SaveChangesAsync();

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
        var receiverCount = await Publisher.PublishChatBotNotificationAsync(
            organizationId,
            room.Id,
            "chat:message_received",
            payload
        );

        Logger.LogDebug(
            "SystemBot message sent: RoomId={RoomId}, MessageId={MessageId}, Receivers={ReceiverCount}",
            room.Id,
            message.Id,
            receiverCount
        );

        // organization グループに未読バッジ更新を通知
        await Publisher.PublishAsync(new SignalRNotification
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

    /// <summary>
    /// 通知メッセージの内容を生成する（継承クラスで実装）
    /// </summary>
    /// <param name="item">アイテム</param>
    /// <param name="ownerName">オーナー名</param>
    /// <param name="workspaceCode">ワークスペースコード</param>
    /// <returns>メッセージ内容</returns>
    protected abstract string BuildNotificationMessage(
        WorkspaceItem item,
        string ownerName,
        string workspaceCode);

    /// <summary>
    /// タスク名を取得する（ログ出力用、継承クラスで実装）
    /// </summary>
    protected abstract string TaskName { get; }

    /// <summary>
    /// アイテム通知の共通処理を実行する
    /// </summary>
    /// <param name="itemId">アイテムID</param>
    protected async Task ExecuteNotificationAsync(int itemId)
    {
        Logger.LogDebug(
            "{TaskName} started: ItemId={ItemId}",
            TaskName,
            itemId
        );

        try
        {
            // 1. アイテムを取得（Workspace と Owner を含む）
            var item = await GetItemWithDetailsAsync(itemId);

            if (item == null)
            {
                Logger.LogWarning(
                    "WorkspaceItem not found: ItemId={ItemId}",
                    itemId
                );
                return;
            }

            if (item.Workspace == null)
            {
                Logger.LogWarning(
                    "Workspace not found for item: ItemId={ItemId}",
                    itemId
                );
                return;
            }

            var organizationId = item.Workspace.OrganizationId;
            var workspaceCode = item.Workspace.Code ?? item.Workspace.Name;
            var ownerName = item.Owner?.Username ?? "不明なユーザー";

            // 2. ワークスペースのグループチャットルームを取得
            var room = await GetWorkspaceGroupChatRoomAsync(item.WorkspaceId);

            if (room == null)
            {
                Logger.LogDebug(
                    "Workspace group chat room not found: WorkspaceId={WorkspaceId}",
                    item.WorkspaceId
                );
                return;
            }

            // 3. SystemBot を取得
            var systemBot = await GetSystemBotAsync(organizationId);
            if (systemBot?.ChatActor == null)
            {
                Logger.LogWarning(
                    "SystemBot not found for organization: OrganizationId={OrganizationId}",
                    organizationId
                );
                return;
            }

            // 4. SystemBot がルームのメンバーか確認し、メンバーでなければ追加
            await EnsureBotIsMemberAsync(room.Id, systemBot.ChatActor.Id);

            // 5. TODO: メッセージ作成が必要か判定（現在は常に作成）

            // 6. メッセージを作成してグループチャットに送信
            var messageContent = BuildNotificationMessage(item, ownerName, workspaceCode);
            await SendBotMessageAsync(organizationId, room, systemBot, messageContent);

            Logger.LogDebug(
                "{TaskName} completed: ItemId={ItemId}, RoomId={RoomId}",
                TaskName,
                itemId,
                room.Id
            );
        }
        catch (Exception ex)
        {
            Logger.LogError(
                ex,
                "{TaskName} failed: ItemId={ItemId}",
                TaskName,
                itemId
            );
            throw;
        }
    }
}
