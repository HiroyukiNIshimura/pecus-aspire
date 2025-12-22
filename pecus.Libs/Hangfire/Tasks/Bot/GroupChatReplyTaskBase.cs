using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// グループチャット返信タスクの抽象基底クラス
/// 共通のメソッドを提供し、継承クラスで具体的な返信処理を実装する
/// </summary>
public abstract class GroupChatReplyTaskBase
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
    /// GroupChatReplyTaskBase のコンストラクタ
    /// </summary>
    protected GroupChatReplyTaskBase(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger logger)
    {
        Context = context;
        Publisher = publisher;
        Logger = logger;
    }

    /// <summary>
    /// チャットルームを取得する（Workspace を含む）
    /// </summary>
    /// <param name="roomId">チャットルームID</param>
    /// <returns>取得したチャットルーム、見つからない場合は null</returns>
    protected async Task<ChatRoom?> GetChatRoomWithDetailsAsync(int roomId)
    {
        return await Context.ChatRooms
            .Include(r => r.Workspace)
            .FirstOrDefaultAsync(r => r.Id == roomId);
    }

    /// <summary>
    /// トリガーメッセージを取得する
    /// </summary>
    /// <param name="messageId">メッセージID</param>
    /// <returns>取得したメッセージ、見つからない場合は null</returns>
    protected async Task<ChatMessage?> GetTriggerMessageAsync(int messageId)
    {
        return await Context.ChatMessages
            .FirstOrDefaultAsync(m => m.Id == messageId);
    }

    /// <summary>
    /// 送信者ユーザーを取得する
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>取得したユーザー、見つからない場合は null</returns>
    protected async Task<User?> GetSenderUserAsync(int userId)
    {
        return await Context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    /// <summary>
    /// Bot を取得する（継承クラスで BotType を指定）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>Bot、見つからない場合は null</returns>
    protected async Task<DB.Models.Bot?> GetBotAsync(int organizationId)
    {
        return await Context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == BotType);
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
                "Bot added to room: RoomId={RoomId}, ChatActorId={ChatActorId}",
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
    /// <param name="bot">Bot</param>
    /// <param name="content">メッセージ内容</param>
    /// <param name="replyToMessageId">返信先メッセージID（オプション）</param>
    protected async Task SendBotMessageAsync(
        int organizationId,
        ChatRoom room,
        DB.Models.Bot bot,
        string content,
        int? replyToMessageId = null)
    {
        // メッセージを作成
        var message = new ChatMessage
        {
            ChatRoomId = room.Id,
            SenderActorId = bot.ChatActor!.Id,
            MessageType = ChatMessageType.Text,
            Content = content,
            ReplyToMessageId = replyToMessageId,
        };
        Context.ChatMessages.Add(message);

        // ルームの UpdatedAt を更新
        room.UpdatedAt = DateTimeOffset.UtcNow;

        await Context.SaveChangesAsync();

        // SignalR 通知を送信（Redis Pub/Sub 経由）
        var payload = BotTaskUtils.BuildMessagePayload(room, message, bot);

        // チャットルームグループに通知
        var receiverCount = await Publisher.PublishChatBotNotificationAsync(
            organizationId,
            room.Id,
            "chat:message_received",
            payload
        );

        Logger.LogDebug(
            "Bot message sent: RoomId={RoomId}, MessageId={MessageId}, Receivers={ReceiverCount}",
            room.Id,
            message.Id,
            receiverCount
        );

        // organization グループに未読バッジ更新を通知
        await Publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:unread_updated",
            Payload = BotTaskUtils.BuildUnreadUpdatedPayload(room, bot.ChatActor.Id),
            SourceType = NotificationSourceType.ChatBot,
            OrganizationId = organizationId,
        });
    }

    /// <summary>
    /// Bot 起動抽選を行う
    /// </summary>
    /// <param name="probability">確度（0-100 の整数、100 で必ず起動）</param>
    /// <returns>抽選結果（true: 起動する、false: 起動しない）</returns>
    protected static bool ShouldActivateBot(int probability) =>
        BotTaskUtils.ShouldActivateBot(probability);

    /// <summary>
    /// 返信メッセージの内容を生成する（継承クラスで実装）
    /// </summary>
    /// <param name="room">チャットルーム</param>
    /// <param name="triggerMessage">トリガーメッセージ</param>
    /// <param name="senderUser">送信者ユーザー</param>
    /// <returns>メッセージ内容</returns>
    protected abstract string BuildReplyMessage(
        ChatRoom room,
        ChatMessage triggerMessage,
        User senderUser);

    /// <summary>
    /// タスク名を取得する（ログ出力用、継承クラスで実装）
    /// </summary>
    protected abstract string TaskName { get; }

    /// <summary>
    /// 使用する BotType を取得する（継承クラスで実装）
    /// </summary>
    protected abstract BotType BotType { get; }

    /// <summary>
    /// グループチャット返信の共通処理を実行する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="triggerMessageId">トリガーとなったメッセージID</param>
    /// <param name="senderUserId">メッセージを送信したユーザーのID</param>
    protected async Task ExecuteReplyAsync(
        int organizationId,
        int roomId,
        int triggerMessageId,
        int senderUserId)
    {
        Logger.LogDebug(
            "{TaskName} started: OrganizationId={OrganizationId}, RoomId={RoomId}, TriggerMessageId={TriggerMessageId}, SenderUserId={SenderUserId}",
            TaskName,
            organizationId,
            roomId,
            triggerMessageId,
            senderUserId
        );

        try
        {
            // 1. チャットルームを取得
            var room = await GetChatRoomWithDetailsAsync(roomId);

            if (room == null)
            {
                Logger.LogWarning(
                    "ChatRoom not found: RoomId={RoomId}",
                    roomId
                );
                return;
            }

            if (room.Type != ChatRoomType.Group)
            {
                Logger.LogWarning(
                    "ChatRoom is not a group chat: RoomId={RoomId}, Type={Type}",
                    roomId,
                    room.Type
                );
                return;
            }

            // 2. トリガーメッセージを取得
            var triggerMessage = await GetTriggerMessageAsync(triggerMessageId);

            if (triggerMessage == null)
            {
                Logger.LogWarning(
                    "Trigger message not found: MessageId={MessageId}",
                    triggerMessageId
                );
                return;
            }

            // 3. 送信者ユーザーを取得
            var senderUser = await GetSenderUserAsync(senderUserId);

            if (senderUser == null)
            {
                Logger.LogWarning(
                    "Sender user not found: UserId={UserId}",
                    senderUserId
                );
                return;
            }

            // 4. Bot を取得
            var bot = await GetBotAsync(organizationId);
            if (bot?.ChatActor == null)
            {
                Logger.LogWarning(
                    "Bot not found for organization: OrganizationId={OrganizationId}, BotType={BotType}",
                    organizationId,
                    BotType
                );
                return;
            }

            // 5. Bot がルームのメンバーか確認し、メンバーでなければ追加
            await EnsureBotIsMemberAsync(room.Id, bot.ChatActor.Id);

            // 6. TODO: メッセージ作成が必要か判定（現在は常に作成）

            // 7. 返信メッセージを作成してグループチャットに送信
            var messageContent = BuildReplyMessage(room, triggerMessage, senderUser);
            await SendBotMessageAsync(organizationId, room, bot, messageContent, triggerMessageId);

            Logger.LogDebug(
                "{TaskName} completed: OrganizationId={OrganizationId}, RoomId={RoomId}",
                TaskName,
                organizationId,
                roomId
            );
        }
        catch (Exception ex)
        {
            Logger.LogError(
                ex,
                "{TaskName} failed: OrganizationId={OrganizationId}, RoomId={RoomId}, TriggerMessageId={TriggerMessageId}",
                TaskName,
                organizationId,
                roomId,
                triggerMessageId
            );
            throw;
        }
    }
}
