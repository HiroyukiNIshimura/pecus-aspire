using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Models;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// AI チャット返信用の Hangfire タスク
/// ユーザーからのメッセージに対して AI が返信を生成し送信する
/// </summary>
public class AiChatReplyTask
{
    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<AiChatReplyTask> _logger;
    private readonly IBotSelector? _botSelector;

    /// <summary>
    /// Bot typing がタイムアウトするまでの時間（秒）
    /// フロントエンド側で自動リセットに使用
    /// </summary>
    public const int TypingTimeoutSeconds = 60;

    /// <summary>
    /// 会話履歴の最大ターン数
    /// </summary>
    private const int MaxConversationTurns = 5;

    /// <summary>
    /// 会話履歴の有効期間（日数）
    /// </summary>
    private const int ConversationHistoryDays = 2;

    /// <summary>
    /// AiChatReplyTask のコンストラクタ
    /// </summary>
    public AiChatReplyTask(
        ApplicationDbContext context,
        IAiClientFactory aiClientFactory,
        SignalRNotificationPublisher publisher,
        ILogger<AiChatReplyTask> logger,
        IBotSelector? botSelector = null)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
        _publisher = publisher;
        _logger = logger;
        _botSelector = botSelector;
    }

    /// <summary>
    /// AI 返信を生成して送信する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="triggerMessageId">トリガーとなったユーザーメッセージID</param>
    /// <param name="senderUserId">メッセージを送信したユーザーのID</param>
    public async Task SendReplyAsync(int organizationId, int roomId, int triggerMessageId, int senderUserId)
    {
        DB.Models.Bot? chatBot = null;

        try
        {
            // 組織設定を取得
            var setting = await GetOrganizationSettingAsync(organizationId);
            if (setting == null ||
                setting.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting.GenerativeApiModel))
            {
                _logger.LogWarning(
                    "GenerativeApiVendor is not configured or required fields are missing: OrganizationId={OrganizationId}, Setting={Setting}, Vendor={Vendor}",
                    organizationId,
                    setting != null ? "exists" : "null",
                    setting?.GenerativeApiVendor
                );
                return;
            }

            // AI クライアントを作成
            var aiClient = _aiClientFactory.CreateClient(
                setting.GenerativeApiVendor,
                setting.GenerativeApiKey,
                setting.GenerativeApiModel
            );

            if (aiClient == null)
            {
                _logger.LogWarning(
                    "Failed to create AI client: Vendor={Vendor}, OrganizationId={OrganizationId}, HasApiKey={HasApiKey}",
                    setting.GenerativeApiVendor,
                    organizationId,
                    !string.IsNullOrEmpty(setting.GenerativeApiKey)
                );
                return;
            }

            // トリガーメッセージを取得
            var triggerMessage = await _context.ChatMessages.FindAsync(triggerMessageId);
            var triggerContent = triggerMessage?.Content ?? string.Empty;

            // 会話履歴を取得して宛先ボットを判定
            var conversationHistory = await BuildConversationHistoryForTargetAnalysisAsync(roomId, organizationId);
            chatBot = await SelectBotByConversationAsync(organizationId, aiClient, conversationHistory, triggerContent);

            // 宛先判定できなかった場合は従来のBotType判定にフォールバック
            if (chatBot?.ChatActor == null)
            {
                var botType = await DetermineBotTypeAsync(organizationId, aiClient, triggerContent);
                chatBot = await GetBotByTypeAsync(organizationId, botType);
            }

            if (chatBot?.ChatActor == null)
            {
                _logger.LogWarning(
                    "ChatBot not found for OrganizationId={OrganizationId}. ChatBot={ChatBot}, ChatActor={ChatActor}",
                    organizationId,
                    chatBot != null ? "exists" : "null",
                    chatBot?.ChatActor != null ? "exists" : "null"
                );
                return;
            }

            // Bot の既読通知を送信（Bot がメッセージを「読んだ」タイミング）
            var readAt = DateTimeOffset.UtcNow;
            await _publisher.PublishChatBotReadAsync(
                organizationId,
                roomId,
                chatBot.ChatActor.Id,
                readAt,
                triggerMessageId
            );

            // Bot の LastReadAt を更新
            await UpdateBotLastReadAtAsync(roomId, chatBot.ChatActor.Id, readAt);

            // 入力開始を通知
            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                roomId,
                chatBot.ChatActor.Id,
                chatBot.Name,
                isTyping: true
            );

            // 会話履歴を取得してメッセージ配列を構築
            var messages = await BuildConversationMessagesAsync(roomId, chatBot.ChatActor.Id);

            // 送信者のユーザー名を取得してシステムメッセージに追加
            var senderUserName = await GetUserNameAsync(senderUserId);
            if (string.IsNullOrEmpty(senderUserName))
            {
                _logger.LogWarning(
                    "User not found for SenderUserId={SenderUserId}, skipping AI reply",
                    senderUserId
                );
                return;
            }
            messages.Insert(0, (MessageRole.System, $"Userを示す二人称は、{senderUserName}さんです。回答はMarkdownは利用せずにプレーンテキストで行ってください。"));

            // AI API を呼び出して返信を生成
            var responseText = await aiClient.GenerateTextWithMessagesAsync(
                messages,
                chatBot.Persona
            );

            // 入力終了を通知
            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                roomId,
                chatBot.ChatActor.Id,
                chatBot.Name,
                isTyping: false
            );

            // メッセージを保存して通知
            await SendBotMessageAsync(organizationId, roomId, chatBot, responseText ?? "...");

            _logger.LogInformation(
                "AiChatReplyTask completed: OrganizationId={OrganizationId}, RoomId={RoomId}",
                organizationId,
                roomId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "AiChatReplyTask failed: OrganizationId={OrganizationId}, RoomId={RoomId}, TriggerMessageId={TriggerMessageId}",
                organizationId,
                roomId,
                triggerMessageId
            );

            // エラー時も入力終了を通知
            if (chatBot?.ChatActor != null)
            {
                try
                {
                    await _publisher.PublishChatBotTypingAsync(
                        organizationId,
                        roomId,
                        chatBot.ChatActor.Id,
                        chatBot.Name,
                        isTyping: false
                    );

                    // エラー通知を送信
                    await _publisher.PublishChatBotErrorAsync(
                        organizationId,
                        roomId,
                        chatBot.ChatActor.Id,
                        chatBot.Name,
                        "申し訳ありません、応答を生成できませんでした。しばらくしてからもう一度お試しください。"
                    );
                }
                catch (Exception notifyEx)
                {
                    _logger.LogError(
                        notifyEx,
                        "Failed to send error notification: RoomId={RoomId}",
                        roomId
                    );
                }
            }

            throw;
        }
    }

    /// <summary>
    /// メッセージの内容に基づいて BotType を決定する
    /// </summary>
    private async Task<BotType> DetermineBotTypeAsync(
        int organizationId,
        IAiClient aiClient,
        string triggerContent)
    {
        if (_botSelector == null)
        {
            return BotType.ChatBot;
        }

        return await _botSelector.DetermineBotTypeByContentAsync(
            aiClient,
            triggerContent
        );
    }

    /// <summary>
    /// 会話履歴に基づいて宛先ボットを選択する
    /// </summary>
    private async Task<DB.Models.Bot?> SelectBotByConversationAsync(
        int organizationId,
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string lastUserMessage)
    {
        if (_botSelector == null || conversationHistory.Count == 0)
        {
            return null;
        }

        return await _botSelector.SelectBotByConversationAsync(
            organizationId,
            aiClient,
            conversationHistory,
            lastUserMessage
        );
    }

    /// <summary>
    /// 宛先判定用の会話履歴を構築する
    /// </summary>
    private async Task<List<ConversationMessage>> BuildConversationHistoryForTargetAnalysisAsync(
        int roomId,
        int organizationId)
    {
        var twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-ConversationHistoryDays);

        var recentMessages = await _context.ChatMessages
            .Where(m => m.ChatRoomId == roomId && m.CreatedAt >= twoDaysAgo)
            .OrderByDescending(m => m.CreatedAt)
            .Take(MaxConversationTurns * 2)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new
            {
                m.SenderActorId,
                m.Content,
            })
            .ToListAsync();

        var actorIds = recentMessages.Select(m => m.SenderActorId).Distinct().ToList();

        var actors = await _context.ChatActors
            .Where(a => actorIds.Contains(a.Id))
            .Select(a => new
            {
                a.Id,
                a.ActorType,
            })
            .ToListAsync();

        var bots = await _context.Bots
            .Include(b => b.ChatActor)
            .Where(b => b.OrganizationId == organizationId && b.ChatActor != null)
            .Select(b => new
            {
                ChatActorId = b.ChatActor!.Id,
                b.Name,
            })
            .ToListAsync();

        var users = await _context.Users
            .Include(u => u.ChatActor)
            .Where(u => u.OrganizationId == organizationId && u.ChatActor != null)
            .Select(u => new
            {
                ChatActorId = u.ChatActor!.Id,
                u.Username,
            })
            .ToListAsync();

        var conversationHistory = new List<ConversationMessage>();

        foreach (var msg in recentMessages)
        {
            var actor = actors.FirstOrDefault(a => a.Id == msg.SenderActorId);
            var isBot = actor?.ActorType == ChatActorType.Bot;

            string senderName;
            if (isBot)
            {
                var bot = bots.FirstOrDefault(b => b.ChatActorId == msg.SenderActorId);
                senderName = bot?.Name ?? "Unknown Bot";
            }
            else
            {
                var user = users.FirstOrDefault(u => u.ChatActorId == msg.SenderActorId);
                senderName = user?.Username ?? "Unknown User";
            }

            conversationHistory.Add(new ConversationMessage
            {
                SenderId = msg.SenderActorId.ToString()!,
                SenderName = senderName,
                IsBot = isBot,
                Content = msg.Content,
            });
        }

        return conversationHistory;
    }

    /// <summary>
    /// 指定された BotType の Bot を取得する
    /// </summary>
    private async Task<DB.Models.Bot?> GetBotByTypeAsync(int organizationId, BotType botType)
    {
        return await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == botType);
    }

    /// <summary>
    /// 組織設定を取得する
    /// </summary>
    private async Task<OrganizationSetting?> GetOrganizationSettingAsync(int organizationId)
    {
        return await _context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);
    }

    /// <summary>
    /// ユーザーの表示名を取得する
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>ユーザーの表示名（見つからない場合は null）</returns>
    private async Task<string?> GetUserNameAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.Username;
    }

    /// <summary>
    /// 会話履歴からメッセージ配列を構築する
    /// 過去3ターン（2日以内）のメッセージを取得
    /// </summary>
    private async Task<List<(MessageRole Role, string Content)>> BuildConversationMessagesAsync(
        int roomId,
        int botActorId)
    {
        var twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-ConversationHistoryDays);

        // 過去のメッセージを取得（最大 MaxConversationTurns * 2 = 6 メッセージ）
        var recentMessages = await _context.ChatMessages
            .Where(m => m.ChatRoomId == roomId && m.CreatedAt >= twoDaysAgo)
            .OrderByDescending(m => m.CreatedAt)
            .Take(MaxConversationTurns * 2)
            .OrderBy(m => m.CreatedAt)  // 時系列順に戻す
            .Select(m => new
            {
                m.SenderActorId,
                m.Content,
            })
            .ToListAsync();

        var messages = new List<(MessageRole Role, string Content)>();

        foreach (var msg in recentMessages)
        {
            // Bot からのメッセージは Assistant、それ以外（ユーザー）は User
            var role = msg.SenderActorId == botActorId
                ? MessageRole.Assistant
                : MessageRole.User;

            messages.Add((role, msg.Content));
        }

        return messages;
    }

    /// <summary>
    /// Bot メッセージを保存して SignalR 通知を送信する
    /// </summary>
    private async Task SendBotMessageAsync(
        int organizationId,
        int roomId,
        DB.Models.Bot chatBot,
        string content)
    {
        // ルームを取得
        var room = await _context.ChatRooms.FindAsync(roomId);
        if (room == null)
        {
            _logger.LogWarning("ChatRoom not found: RoomId={RoomId}", roomId);
            return;
        }

        // メッセージを作成
        var message = new DB.Models.ChatMessage
        {
            ChatRoomId = roomId,
            SenderActorId = chatBot.ChatActor!.Id,
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
            RoomId = roomId,
            RoomType = room.Type.ToString(),
            Message = new
            {
                message.Id,
                SenderActorId = chatBot.ChatActor.Id,
                message.MessageType,
                message.Content,
                message.ReplyToMessageId,
                message.CreatedAt,
                Sender = new
                {
                    Id = chatBot.ChatActor.Id,
                    ActorType = chatBot.ChatActor.ActorType.ToString(),
                    UserId = (int?)null,
                    BotId = chatBot.Id,
                    DisplayName = chatBot.Name,
                    AvatarType = chatBot.ChatActor.AvatarType?.ToString()?.ToLowerInvariant(),
                    AvatarUrl = chatBot.IconUrl,
                    IdentityIconUrl = chatBot.IconUrl ?? "",
                    IsActive = true,
                },
            },
        };

        // チャットルームグループに通知
        await _publisher.PublishChatBotNotificationAsync(
            organizationId,
            roomId,
            "chat:message_received",
            payload
        );

        // organization グループに未読バッジ更新を通知
        await _publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:unread_updated",
            Payload = new
            {
                RoomId = roomId,
                RoomType = room.Type.ToString(),
                SenderActorId = chatBot.ChatActor.Id,
            },
            SourceType = NotificationSourceType.ChatBot,
            OrganizationId = organizationId,
        });
    }

    /// <summary>
    /// Bot の LastReadAt を更新する
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="botActorId">Bot のアクターID</param>
    /// <param name="readAt">既読日時</param>
    private async Task UpdateBotLastReadAtAsync(int roomId, int botActorId, DateTimeOffset readAt)
    {
        var member = await _context.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == roomId && m.ChatActorId == botActorId);

        if (member != null)
        {
            member.LastReadAt = readAt;
            await _context.SaveChangesAsync();
        }
    }
}