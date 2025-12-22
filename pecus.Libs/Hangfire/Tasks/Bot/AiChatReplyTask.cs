using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
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

    /// <summary>
    /// Bot typing がタイムアウトするまでの時間（秒）
    /// フロントエンド側で自動リセットに使用
    /// </summary>
    public const int TypingTimeoutSeconds = 60;

    /// <summary>
    /// 会話履歴の最大ターン数
    /// </summary>
    private const int MaxConversationTurns = 3;

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
        ILogger<AiChatReplyTask> logger)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
        _publisher = publisher;
        _logger = logger;
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
            // 1. ChatBot を取得
            chatBot = await GetChatBotAsync(organizationId);
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

            // 2. 組織設定を取得
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

            // 3. AI クライアントを作成
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

            // 4. 入力開始を通知
            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                roomId,
                chatBot.ChatActor.Id,
                chatBot.Name,
                isTyping: true
            );

            // 5. 会話履歴を取得してメッセージ配列を構築
            var messages = await BuildConversationMessagesAsync(roomId, chatBot.ChatActor.Id);

            // 6. 送信者のユーザー名を取得してシステムメッセージに追加
            var senderUserName = await GetUserNameAsync(senderUserId);
            if (string.IsNullOrEmpty(senderUserName))
            {
                _logger.LogWarning(
                    "User not found for SenderUserId={SenderUserId}, skipping AI reply",
                    senderUserId
                );
                return;
            }
            messages.Insert(0, (MessageRole.System, $"Userを示す二人称は、{senderUserName}さんです。"));

            // 7. AI API を呼び出して返信を生成
            var responseText = await aiClient.GenerateTextWithMessagesAsync(
                messages,
                chatBot.Persona
            );

            // 8. 入力終了を通知
            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                roomId,
                chatBot.ChatActor.Id,
                chatBot.Name,
                isTyping: false
            );

            // 9. メッセージを保存して通知
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
    /// ChatBot を取得する
    /// </summary>
    private async Task<DB.Models.Bot?> GetChatBotAsync(int organizationId)
    {
        return await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == BotType.ChatBot);
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
        var message = new ChatMessage
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
}
