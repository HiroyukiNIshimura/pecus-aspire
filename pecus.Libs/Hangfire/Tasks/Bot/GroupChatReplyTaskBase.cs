using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
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
    /// AI クライアントファクトリー
    /// </summary>
    protected readonly IAiClientFactory AiClientFactory;

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
        IAiClientFactory aiClientFactory,
        ILogger logger)
    {
        Context = context;
        Publisher = publisher;
        AiClientFactory = aiClientFactory;
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
    /// 指定したルームの過去 N ターンのメッセージを取得する
    /// </summary>
    /// <param name="roomId">チャットルーム ID</param>
    /// <param name="turns">取得するターン数</param>
    /// <param name="beforeMessageId">このメッセージ ID より前のメッセージを取得（null の場合は最新から）</param>
    /// <returns>過去メッセージのリスト（古い順）</returns>
    /// <remarks>
    /// 取得したメッセージには以下の情報が含まれます：
    /// - IsBot: 送信者が Bot かどうか
    /// - UserName: 送信者名（ユーザー名または Bot 名）
    /// - Content: メッセージ本文
    /// - CreatedAt: 送信日時
    /// </remarks>
    protected async Task<List<BotChatMessageInfo>> GetRecentMessagesAsync(
        int roomId,
        int turns,
        int? beforeMessageId = null)
    {
        var query = Context.ChatMessages
            .Where(m => m.ChatRoomId == roomId);

        if (beforeMessageId.HasValue)
        {
            query = query.Where(m => m.Id < beforeMessageId.Value);
        }

        var messages = await query
            .OrderByDescending(m => m.Id)
            .Take(turns)
            .Include(m => m.SenderActor)
            .ToListAsync();

        // 古い順に並べ替えて BotChatMessageInfo に変換
        messages.Reverse();
        return messages.Select(BotChatMessageInfo.FromChatMessage).ToList();
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
    /// 組織設定を取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>組織設定、見つからない場合は null</returns>
    protected async Task<OrganizationSetting?> GetOrganizationSettingAsync(int organizationId)
    {
        return await Context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);
    }

    /// <summary>
    /// Bot を取得する（継承クラスで BotType を指定）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>Bot、見つからない場合は null</returns>
    protected async Task<DB.Models.Bot?> GetBotAsync(int organizationId)
    {
        return await GetBotByTypeAsync(organizationId, BotType);
    }

    /// <summary>
    /// 指定した BotType の Bot を取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="botType">取得する Bot の種類</param>
    /// <returns>Bot、見つからない場合は null</returns>
    protected async Task<DB.Models.Bot?> GetBotByTypeAsync(int organizationId, BotType botType)
    {
        return await Context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == botType);
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
        await Publisher.PublishChatBotNotificationAsync(
            organizationId,
            room.Id,
            "chat:message_received",
            payload
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
    /// <param name="organizationId">組織ID</param>
    /// <param name="room">チャットルーム</param>
    /// <param name="triggerMessage">トリガーメッセージ</param>
    /// <param name="senderUser">送信者ユーザー</param>
    /// <returns>メッセージ内容と使用する BotType のタプル</returns>
    protected abstract Task<(string Message, BotType BotType)> BuildReplyMessage(
        int organizationId,
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
        DB.Models.Bot? bot = null;
        ChatRoom? room = null;

        try
        {
            // チャットルームを取得
            room = await GetChatRoomWithDetailsAsync(roomId);

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

            // トリガーメッセージを取得
            var triggerMessage = await GetTriggerMessageAsync(triggerMessageId);

            if (triggerMessage == null)
            {
                Logger.LogWarning(
                    "Trigger message not found: MessageId={MessageId}",
                    triggerMessageId
                );
                return;
            }

            // 送信者ユーザーを取得
            var senderUser = await GetSenderUserAsync(senderUserId);

            if (senderUser == null)
            {
                Logger.LogWarning(
                    "Sender user not found: UserId={UserId}",
                    senderUserId
                );
                return;
            }

            // 返信メッセージと使用する BotType を決定
            var (messageContent, selectedBotType) = await BuildReplyMessage(organizationId, room, triggerMessage, senderUser);

            // 選択された BotType で Bot を取得
            bot = await GetBotByTypeAsync(organizationId, selectedBotType);
            if (bot?.ChatActor == null)
            {
                Logger.LogWarning(
                    "Bot not found for organization: OrganizationId={OrganizationId}, BotType={BotType}",
                    organizationId,
                    selectedBotType
                );
                return;
            }

            // Bot がルームのメンバーか確認し、メンバーでなければ追加
            await EnsureBotIsMemberAsync(room.Id, bot.ChatActor.Id);

            // 入力開始を通知
            await Publisher.PublishChatBotTypingAsync(
                organizationId,
                room.Id,
                bot.ChatActor.Id,
                bot.Name,
                isTyping: true
            );

            // 返信メッセージをグループチャットに送信
            await SendBotMessageAsync(organizationId, room, bot, messageContent, triggerMessageId);

            // 入力終了を通知
            await Publisher.PublishChatBotTypingAsync(
                organizationId,
                room.Id,
                bot.ChatActor.Id,
                bot.Name,
                isTyping: false
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

            // エラー時も入力終了を通知
            if (bot?.ChatActor != null && room != null)
            {
                try
                {
                    await Publisher.PublishChatBotTypingAsync(
                        organizationId,
                        room.Id,
                        bot.ChatActor.Id,
                        bot.Name,
                        isTyping: false
                    );
                }
                catch (Exception notifyEx)
                {
                    Logger.LogError(
                        notifyEx,
                        "Failed to send typing end notification: RoomId={RoomId}",
                        room.Id
                    );
                }
            }

            throw;
        }
    }
}
