using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
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
    /// 返信判定アナライザー（オプション）
    /// </summary>
    protected readonly IShouldReplyAnalyzer? ShouldReplyAnalyzer;

    /// <summary>
    /// GroupChatReplyTaskBase のコンストラクタ
    /// </summary>
    protected GroupChatReplyTaskBase(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        IAiClientFactory aiClientFactory,
        ILogger logger,
        IShouldReplyAnalyzer? shouldReplyAnalyzer = null)
    {
        Context = context;
        Publisher = publisher;
        AiClientFactory = aiClientFactory;
        Logger = logger;
        ShouldReplyAnalyzer = shouldReplyAnalyzer;
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
    /// 組織のすべての Bot を取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>Bot のリスト</returns>
    protected async Task<List<DB.Models.Bot>> GetAllBotsAsync(int organizationId)
    {
        return await Context.Bots
            .Include(b => b.ChatActor)
            .Where(b => b.OrganizationId == organizationId && b.ChatActor != null)
            .ToListAsync();
    }

    /// <summary>
    /// 返信すべきかどうかを AI で判定する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="triggerMessageId">トリガーメッセージID</param>
    /// <returns>判定結果、判定をスキップした場合は null</returns>
    protected async Task<AI.Models.GroupChatReplyDecision?> EvaluateShouldReplyAsync(
        int organizationId,
        int roomId,
        int triggerMessageId)
    {
        if (ShouldReplyAnalyzer == null)
        {
            return null;
        }

        var setting = await GetOrganizationSettingAsync(organizationId);
        if (setting == null ||
            setting.GenerativeApiVendor == GenerativeApiVendor.None ||
            string.IsNullOrEmpty(setting.GenerativeApiKey) ||
            string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            Logger.LogDebug(
                "Skipping should-reply analysis: AI not configured for OrganizationId={OrganizationId}",
                organizationId
            );
            return null;
        }

        var aiClient = AiClientFactory.CreateClient(
            setting.GenerativeApiVendor,
            setting.GenerativeApiKey,
            setting.GenerativeApiModel
        );

        if (aiClient == null)
        {
            Logger.LogDebug(
                "Skipping should-reply analysis: Failed to create AI client for OrganizationId={OrganizationId}",
                organizationId
            );
            return null;
        }

        var triggerMessage = await GetTriggerMessageAsync(triggerMessageId);
        if (triggerMessage == null || string.IsNullOrWhiteSpace(triggerMessage.Content))
        {
            Logger.LogDebug(
                "Skipping should-reply analysis: Trigger message not found or empty: MessageId={MessageId}",
                triggerMessageId
            );
            return null;
        }

        var recentMessages = await GetRecentMessagesAsync(roomId, 10, triggerMessageId);
        var conversationHistory = recentMessages
            .Select(m => new AI.Models.ConversationMessage
            {
                SenderId = m.SenderActorId?.ToString() ?? string.Empty,
                SenderName = m.UserName,
                Content = m.Content,
                IsBot = m.IsBot,
            })
            .ToList();

        var allBots = await GetAllBotsAsync(organizationId);
        var availableBots = allBots
            .Where(b => b.ChatActor != null)
            .Select(b => new AI.Models.BotInfo
            {
                ChatActorId = b.ChatActor!.Id,
                Name = b.Name,
                RoleDescription = b.Type switch
                {
                    BotType.ChatBot => "親しみやすいサポート担当",
                    BotType.SystemBot => "公式アナウンス担当",
                    _ => "チャットボット",
                },
            })
            .ToList();

        if (availableBots.Count == 0)
        {
            Logger.LogDebug(
                "Skipping should-reply analysis: No bots available for OrganizationId={OrganizationId}",
                organizationId
            );
            return null;
        }

        try
        {
            var decision = await ShouldReplyAnalyzer.AnalyzeAsync(
                aiClient,
                conversationHistory,
                triggerMessage.Content,
                availableBots
            );

            Logger.LogDebug(
                "Should-reply decision: ShouldReply={ShouldReply}, ResponderBot={ResponderBot}, Confidence={Confidence}, Reasoning={Reasoning}",
                decision.ShouldAnyoneReply,
                decision.ResponderBotName,
                decision.Confidence,
                decision.Reasoning
            );

            return decision;
        }
        catch (Exception ex)
        {
            Logger.LogWarning(
                ex,
                "Should-reply analysis failed, proceeding with default behavior: OrganizationId={OrganizationId}, RoomId={RoomId}",
                organizationId,
                roomId
            );
            return null;
        }
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
        await Context.SaveChangesAsync();

        // ルームの UpdatedAt を更新（後勝ち、RowVersion 競合回避）
        await Context.ChatRooms
            .Where(r => r.Id == room.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));

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
    /// 使用する BotType を決定する（継承クラスで実装）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="triggerMessage">トリガーメッセージ</param>
    /// <returns>使用する BotType</returns>
    /// <remarks>
    /// このメソッドは typing 通知の前に呼び出されるため、軽量な処理にすること。
    /// AI を使った感情分析など、比較的軽い処理は許容される。
    /// </remarks>
    protected abstract Task<BotType> DetermineBotTypeAsync(
        int organizationId,
        ChatMessage triggerMessage);

    /// <summary>
    /// 返信メッセージの内容を生成する（継承クラスで実装）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="room">チャットルーム</param>
    /// <param name="triggerMessage">トリガーメッセージ</param>
    /// <param name="senderUser">送信者ユーザー</param>
    /// <param name="bot">使用する Bot</param>
    /// <returns>メッセージ内容</returns>
    protected abstract Task<string> BuildReplyMessageAsync(
        int organizationId,
        ChatRoom room,
        ChatMessage triggerMessage,
        User senderUser,
        DB.Models.Bot bot);

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
        // 組織設定を取得し、Botのグループチャットメッセージが無効ならスキップ
        var orgSetting = await GetOrganizationSettingAsync(organizationId);
        if (orgSetting != null && !orgSetting.BotGroupChatMessagesEnabled)
        {
            Logger.LogDebug(
                "Skipping {TaskName}: BotGroupChatMessagesEnabled is disabled for OrganizationId={OrganizationId}",
                TaskName,
                organizationId);
            return;
        }

        DB.Models.Bot? bot = null;
        ChatRoom? room = null;

        // 生成AIでこのタイミングで発言すべきかどうかを判定する処理
        var replyDecision = await EvaluateShouldReplyAsync(
            organizationId,
            roomId,
            triggerMessageId
        );

        if (replyDecision != null && !replyDecision.ShouldAnyoneReply)
        {
            Logger.LogDebug(
                "Skipping reply based on AI analysis: RoomId={RoomId}, Reasoning={Reasoning}, Confidence={Confidence}",
                roomId,
                replyDecision.Reasoning,
                replyDecision.Confidence
            );
            return;
        }

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

            if (replyDecision != null && replyDecision.ResponderBotActorId != null)
            {
                // AI が選択した Bot を使用
                bot = await Context.Bots
                    .Include(b => b.ChatActor)
                    .FirstOrDefaultAsync(b =>
                        b.OrganizationId == organizationId &&
                        b.ChatActor != null &&
                        b.ChatActor.Id == replyDecision.ResponderBotActorId);

                if (bot == null)
                {
                    Logger.LogWarning(
                        "AI selected bot not found, falling back to DetermineBotTypeAsync: ResponderBotActorId={ResponderBotActorId}",
                        replyDecision.ResponderBotActorId
                    );
                }
            }

            if (bot == null)
            {
                // 使用する BotType を決定
                var selectedBotType = await DetermineBotTypeAsync(organizationId, triggerMessage);
                bot = await GetBotByTypeAsync(organizationId, selectedBotType);
            }

            if (bot?.ChatActor == null)
            {
                Logger.LogWarning(
                    "Bot | Bot.ChatActor not found for organization: OrganizationId={OrganizationId}, BotName={Name}",
                    organizationId,
                    bot?.Name
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

            // 返信メッセージを生成
            var messageContent = await BuildReplyMessageAsync(organizationId, room, triggerMessage, senderUser, bot);

            // 空文字またはnullの場合はメッセージ送信をスキップ（Silent behavior等）
            if (!string.IsNullOrEmpty(messageContent))
            {
                // 返信メッセージをグループチャットに送信
                await SendBotMessageAsync(organizationId, room, bot, messageContent, triggerMessageId);
            }
            else
            {
                Logger.LogDebug(
                    "Skipping message send due to empty content: OrganizationId={OrganizationId}, RoomId={RoomId}",
                    organizationId,
                    room.Id
                );
            }

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