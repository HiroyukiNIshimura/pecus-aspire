using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスクコメントで HelpWanted が投稿された際にグループチャットへ通知する Hangfire タスク
/// SystemBot がワークスペースグループチャットにメッセージを送信する
/// </summary>
public class TaskCommentHelpWantedTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly ILogger<TaskCommentHelpWantedTask> _logger;

    /// <summary>
    /// TaskCommentHelpWantedTask のコンストラクタ
    /// </summary>
    public TaskCommentHelpWantedTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        IAiClientFactory aiClientFactory,
        ILogger<TaskCommentHelpWantedTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _aiClientFactory = aiClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// HelpWanted コメントに対するグループチャット通知を送信する
    /// </summary>
    /// <param name="commentId">タスクコメントID</param>
    public async Task SendHelpWantedNotificationAsync(int commentId)
    {
        DB.Models.Bot? bot = null;
        ChatRoom? room = null;

        try
        {
            var comment = await _context.TaskComments
                .Include(c => c.User)
                .Include(c => c.WorkspaceTask)
                    .ThenInclude(t => t.WorkspaceItem)
                        .ThenInclude(i => i.Workspace)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null)
            {
                _logger.LogWarning(
                    "TaskComment not found: CommentId={CommentId}",
                    commentId
                );
                return;
            }

            if (comment.CommentType != TaskCommentType.HelpWanted)
            {
                _logger.LogDebug(
                    "TaskComment is not HelpWanted type, skipping: CommentId={CommentId}, Type={Type}",
                    commentId,
                    comment.CommentType
                );
                return;
            }

            var task = comment.WorkspaceTask;
            var item = task?.WorkspaceItem;
            var workspace = item?.Workspace;

            if (workspace == null)
            {
                _logger.LogWarning(
                    "Workspace not found for comment: CommentId={CommentId}",
                    commentId
                );
                return;
            }

            var organizationId = workspace.OrganizationId;

            room = await _context.ChatRooms
                .FirstOrDefaultAsync(r =>
                    r.Type == ChatRoomType.Group &&
                    r.WorkspaceId == workspace.Id);

            if (room == null)
            {
                _logger.LogWarning(
                    "Workspace group chat room not found: WorkspaceId={WorkspaceId}",
                    workspace.Id
                );
                return;
            }

            bot = await _context.Bots
                .Include(b => b.ChatActor)
                .FirstOrDefaultAsync(b =>
                    b.OrganizationId == organizationId &&
                    b.Type == BotType.SystemBot);

            if (bot?.ChatActor == null)
            {
                _logger.LogWarning(
                    "SystemBot not found for organization: OrganizationId={OrganizationId}",
                    organizationId
                );
                return;
            }

            await EnsureBotIsMemberAsync(room.Id, bot.ChatActor.Id);

            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                room.Id,
                bot.ChatActor.Id,
                bot.Name,
                isTyping: true
            );

            var messageContent = await BuildMessageAsync(
                organizationId,
                comment,
                task!,
                item!,
                workspace
            );

            await SendBotMessageAsync(organizationId, room, bot, messageContent);

            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                room.Id,
                bot.ChatActor.Id,
                bot.Name,
                isTyping: false
            );

            _logger.LogInformation(
                "HelpWanted notification sent: CommentId={CommentId}, RoomId={RoomId}",
                commentId,
                room.Id
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "TaskCommentHelpWantedTask failed: CommentId={CommentId}",
                commentId
            );

            if (bot?.ChatActor != null && room != null)
            {
                try
                {
                    await _publisher.PublishChatBotTypingAsync(
                        room.OrganizationId,
                        room.Id,
                        bot.ChatActor.Id,
                        bot.Name,
                        isTyping: false
                    );
                }
                catch (Exception notifyEx)
                {
                    _logger.LogError(
                        notifyEx,
                        "Failed to send typing end notification: RoomId={RoomId}",
                        room.Id
                    );
                }
            }

            throw;
        }
    }

    /// <summary>
    /// 通知メッセージを生成する
    /// AI が有効な場合は AI でメッセージを生成、無効な場合は定型メッセージを返す
    /// </summary>
    private async Task<string> BuildMessageAsync(
        int organizationId,
        TaskComment comment,
        WorkspaceTask task,
        WorkspaceItem item,
        Workspace workspace)
    {
        var userName = comment.User?.Username ?? "不明なユーザー";
        var taskContent = task.Content ?? "無題のタスク";
        var itemSubject = item.Subject ?? "無題のアイテム";
        var commentContent = comment.Content ?? "";

        var setting = await _context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

        if (setting == null ||
            setting.GenerativeApiVendor == GenerativeApiVendor.None ||
            string.IsNullOrEmpty(setting.GenerativeApiKey) ||
            string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            return BuildDefaultMessage(userName, taskContent, itemSubject);
        }

        var aiClient = _aiClientFactory.CreateClient(
            setting.GenerativeApiVendor,
            setting.GenerativeApiKey,
            setting.GenerativeApiModel
        );

        if (aiClient == null)
        {
            _logger.LogWarning(
                "Failed to create AI client: Vendor={Vendor}, OrganizationId={OrganizationId}",
                setting.GenerativeApiVendor,
                organizationId
            );
            return BuildDefaultMessage(userName, taskContent, itemSubject);
        }

        try
        {
            var (systemPrompt, userPrompt) = BuildAiPrompt(userName, taskContent, itemSubject, commentContent);
            var response = await aiClient.GenerateTextAsync(systemPrompt, userPrompt);

            if (!string.IsNullOrWhiteSpace(response))
            {
                return response;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "AI message generation failed, using default message: OrganizationId={OrganizationId}",
                organizationId
            );
        }

        return BuildDefaultMessage(userName, taskContent, itemSubject);
    }

    /// <summary>
    /// AI へのプロンプトを生成する
    /// </summary>
    private static (string SystemPrompt, string UserPrompt) BuildAiPrompt(
        string userName,
        string taskContent,
        string itemSubject,
        string commentContent)
    {
        var systemPrompt = """
            あなたはチームのサポートBotです。
            チームメンバーに助けを求めるメッセージを作成してください。
            メッセージは親しみやすく、協力を促すトーンで作成してください。
            絵文字を適度に使用してください。
            100文字以内で簡潔に作成してください。
            """;

        var userPrompt = $"""
            ユーザー名: {userName}
            アイテム: {itemSubject}
            タスク: {taskContent}
            コメント内容: {commentContent}
            """;

        return (systemPrompt, userPrompt);
    }

    /// <summary>
    /// デフォルトの通知メッセージを生成する（AI が無効な場合に使用）
    /// </summary>
    private static string BuildDefaultMessage(
        string userName,
        string taskContent,
        string itemSubject)
    {
        var truncatedTaskContent = taskContent.Length > 30
            ? taskContent[..30] + "..."
            : taskContent;
        return $"🆘 {userName}さんがタスク『{truncatedTaskContent}』（{itemSubject}）でヘルプを求めています";
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
                "Bot added to room: RoomId={RoomId}, ChatActorId={ChatActorId}",
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
        DB.Models.Bot bot,
        string content)
    {
        var message = new ChatMessage
        {
            ChatRoomId = room.Id,
            SenderActorId = bot.ChatActor!.Id,
            MessageType = ChatMessageType.Text,
            Content = content,
        };
        _context.ChatMessages.Add(message);

        room.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        var payload = BotTaskUtils.BuildMessagePayload(room, message, bot);

        await _publisher.PublishChatBotNotificationAsync(
            organizationId,
            room.Id,
            "chat:message_received",
            payload
        );

        await _publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:unread_updated",
            Payload = BotTaskUtils.BuildUnreadUpdatedPayload(room, bot.ChatActor.Id),
            SourceType = NotificationSourceType.ChatBot,
            OrganizationId = organizationId,
        });
    }
}
