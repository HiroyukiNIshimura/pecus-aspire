using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// ChatBot 関連の Hangfire タスク
/// </summary>
public class FirstTouchdownTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<FirstTouchdownTask> _logger;

    /// <summary>
    /// FirstTouchdownTask のコンストラクタ
    /// </summary>
    public FirstTouchdownTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<FirstTouchdownTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
    }

    /// <summary>
    /// ログイン時のウェルカムメッセージを送信する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="userId">ユーザーID</param>
    /// <param name="username">ユーザー名</param>
    public async Task WelcomeMessageAsync(int organizationId, int userId, string username)
    {
        _logger.LogInformation(
            "ChatBotTasks.SendLoginWelcomeMessageAsync started: OrganizationId={OrganizationId}, UserId={UserId}",
            organizationId,
            userId
        );

        var user = await _context.Users.FindAsync(userId);
        if (user == null || !user.IsActive || user.LastLoginAt.HasValue)
        {
            return;
        }

        // 10秒待機
        await Task.Delay(TimeSpan.FromSeconds(10));

        try
        {
            // 1. ChatBot を取得
            var chatBot = await _context.Bots
                .Include(b => b.ChatActor)
                .FirstOrDefaultAsync(b =>
                    b.OrganizationId == organizationId &&
                    b.Type == BotType.ChatBot);

            if (chatBot?.ChatActor == null)
            {
                _logger.LogWarning(
                    "ChatBot not found for OrganizationId={OrganizationId}",
                    organizationId
                );
                return;
            }

            // 2. ユーザーの AI ルームを取得または作成
            var userActor = await _context.ChatActors
                .FirstOrDefaultAsync(a => a.UserId == userId);

            if (userActor == null)
            {
                _logger.LogWarning("User ChatActor not found for UserId={UserId}", userId);
                return;
            }

            var aiRoom = await _context.ChatRooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r =>
                    r.OrganizationId == organizationId &&
                    r.Type == ChatRoomType.Ai &&
                    r.Members.Any(m => m.ChatActorId == userActor.Id));

            if (aiRoom == null)
            {
                // AI ルームを作成
                aiRoom = new ChatRoom
                {
                    Type = ChatRoomType.Ai,
                    Name = "AI アシスタント",
                    OrganizationId = organizationId,
                    CreatedByUserId = userId,
                    Members =
                    [
                        new ChatRoomMember { ChatActorId = userActor.Id, Role = ChatRoomRole.Owner },
                        new ChatRoomMember { ChatActorId = chatBot.ChatActor.Id, Role = ChatRoomRole.Member },
                    ],
                };
                _context.ChatRooms.Add(aiRoom);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Created AI room: RoomId={RoomId}, UserId={UserId}",
                    aiRoom.Id,
                    userId
                );
            }

            // 3. メッセージを作成
            var content = $"👋 {username}さん、初めまして！\n\n {chatBot.Name}です！\n\n 何かお手伝いできることはありますか？タスクの確認や質問など、お気軽にどうぞ。";

            var message = new ChatMessage
            {
                ChatRoomId = aiRoom.Id,
                SenderActorId = chatBot.ChatActor.Id,
                MessageType = ChatMessageType.Text,
                Content = content,
            };
            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            // 4. SignalR 通知を送信（Redis Pub/Sub 経由）
            // 注: チャットルームグループ (chat:{roomId}) ではなく組織グループ (organization:{orgId}) に送信
            // ユーザーはログイン直後にチャットルームグループに未参加のため
            var payload = new
            {
                roomId = aiRoom.Id,
                roomType = aiRoom.Type.ToString(),
                message = new
                {
                    id = message.Id,
                    senderActorId = chatBot.ChatActor.Id,
                    messageType = message.MessageType.ToString(),
                    content = message.Content,
                    createdAt = message.CreatedAt,
                    sender = new
                    {
                        id = 0, // Bot なので 0
                        username = chatBot.Name,
                        email = "",
                        identityIconUrl = chatBot.IconUrl ?? "",
                        isActive = true,
                    },
                },
            };

            // 組織グループに通知（ログイン直後のユーザーにも届くように）
            var receiverCount = await _publisher.PublishAsync(new SignalRNotification
            {
                GroupName = $"organization:{organizationId}",
                EventType = "chat:message_received",
                Payload = payload,
                SourceType = NotificationSourceType.ChatBot,
                OrganizationId = organizationId,
            });

            _logger.LogDebug(
                "Published ChatBot notification: RoomId={RoomId}, MessageId={MessageId}, Receivers={ReceiverCount}",
                aiRoom.Id,
                message.Id,
                receiverCount
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send login welcome message: OrganizationId={OrganizationId}, UserId={UserId}",
                organizationId,
                userId
            );
            throw;
        }
    }
}