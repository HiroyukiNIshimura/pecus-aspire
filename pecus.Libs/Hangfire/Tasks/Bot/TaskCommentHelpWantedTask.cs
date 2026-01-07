using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Prompts;
using Pecus.Libs.AI.Prompts.Notifications;
using Pecus.Libs.AI.Tools;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスクコメントで HelpWanted が投稿された際にグループチャットへ通知する Hangfire タスク
/// SystemBot がワークスペースグループチャットにメッセージを送信する
/// 類似タスクの担当者候補も同時に提案する
/// </summary>
public class TaskCommentHelpWantedTask
{
    private readonly HelpWantedPromptTemplate _promptTemplate = new();
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly IAiToolExecutor _aiToolExecutor;
    private readonly ILogger<TaskCommentHelpWantedTask> _logger;

    /// <summary>
    /// TaskCommentHelpWantedTask のコンストラクタ
    /// </summary>
    public TaskCommentHelpWantedTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        IAiClientFactory aiClientFactory,
        IAiToolExecutor aiToolExecutor,
        ILogger<TaskCommentHelpWantedTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _aiClientFactory = aiClientFactory;
        _aiToolExecutor = aiToolExecutor;
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
                .AsSplitQuery()
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
    /// 類似タスクの担当者候補がいれば追加提案する
    /// </summary>
    private async Task<string> BuildMessageAsync(
        int organizationId,
        TaskComment comment,
        WorkspaceTask task,
        WorkspaceItem item,
        Workspace workspace)
    {
        var userName = comment.User?.Username ?? "不明なユーザー";
        var workspaceCode = workspace.Code ?? workspace.Name;
        var itemCode = item.Code;
        var taskSequence = task.Sequence;
        var taskContent = task.Content ?? "無題のタスク";
        var commentContent = comment.Content ?? "";

        var defaultMessage = BuildDefaultMessage(userName, workspaceCode, itemCode, taskSequence);

        var setting = await _context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

        var aiMessage = await TryGenerateAiMessageAsync(
            organizationId,
            setting,
            userName,
            taskContent,
            commentContent
        );

        var suggestionMessage = await TryGetSimilarTaskSuggestionAsync(
            organizationId,
            setting,
            task.TaskTypeId,
            taskContent,
            comment.UserId
        );

        return BuildFinalMessage(defaultMessage, aiMessage, suggestionMessage);
    }

    /// <summary>
    /// AI メッセージの生成を試行する
    /// </summary>
    private async Task<string?> TryGenerateAiMessageAsync(
        int organizationId,
        OrganizationSetting? setting,
        string userName,
        string taskContent,
        string commentContent)
    {
        if (setting == null ||
            setting.GenerativeApiVendor == GenerativeApiVendor.None ||
            string.IsNullOrEmpty(setting.GenerativeApiKey) ||
            string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            return null;
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
            return null;
        }

        try
        {
            var prompt = _promptTemplate.Build(new HelpWantedPromptInput(
                UserName: userName,
                TaskContent: taskContent,
                CommentContent: commentContent
            ));
            var response = await aiClient.GenerateTextAsync(prompt.SystemPrompt, prompt.UserPrompt);

            if (!string.IsNullOrWhiteSpace(response))
            {
                if (response.Length > 100)
                {
                    response = response[..97] + "...";
                }
                return response;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "AI message generation failed: OrganizationId={OrganizationId}",
                organizationId
            );
        }

        return null;
    }

    /// <summary>
    /// 類似タスクの担当者提案を取得する
    /// </summary>
    private async Task<string?> TryGetSimilarTaskSuggestionAsync(
        int organizationId,
        OrganizationSetting? setting,
        int? taskTypeId,
        string taskContent,
        int userId)
    {
        if (setting == null ||
            setting.GenerativeApiVendor == GenerativeApiVendor.None ||
            string.IsNullOrEmpty(setting.GenerativeApiKey) ||
            string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            return null;
        }

        try
        {
            var toolContext = new AiToolContext
            {
                UserId = userId,
                FunctionArguments = new Dictionary<string, object>
                {
                    ["organizationId"] = organizationId,
                    ["taskTypeId"] = taskTypeId ?? 0,
                    ["taskContent"] = taskContent,
                    ["excludeUserId"] = userId,
                },
            };

            var result = await _aiToolExecutor.ExecuteByNameAsync(
                "suggest_similar_task_experts",
                toolContext
            );

            if (!string.IsNullOrWhiteSpace(result?.ContextPrompt))
            {
                return result.ContextPrompt;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Similar task suggestion failed: OrganizationId={OrganizationId}",
                organizationId
            );
        }

        return null;
    }

    /// <summary>
    /// 最終メッセージを組み立てる
    /// </summary>
    private static string BuildFinalMessage(
        string defaultMessage,
        string? aiMessage,
        string? suggestionMessage)
    {
        var parts = new List<string> { defaultMessage };

        if (!string.IsNullOrWhiteSpace(aiMessage))
        {
            parts.Add(aiMessage);
        }
        else if (!string.IsNullOrWhiteSpace(suggestionMessage))
        {
            parts.Add("誰か助けてあげてください！");
        }

        if (!string.IsNullOrWhiteSpace(suggestionMessage))
        {
            parts.Add(suggestionMessage);
        }

        return string.Join("\n\n", parts);
    }

    /// <summary>
    /// デフォルトの通知メッセージを生成する（AI が無効な場合に使用）
    /// </summary>
    private static string BuildDefaultMessage(
        string userName,
        string workspaceCode,
        string itemCode,
        int taskSequence)
    {
        return $"{userName}さんがヘルプコメントを投稿しました。\n[{workspaceCode}#{itemCode}T{taskSequence}]";
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
        await _context.SaveChangesAsync();

        // ルームの UpdatedAt を更新（後勝ち、RowVersion 競合回避）
        await _context.ChatRooms
            .Where(r => r.Id == room.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));

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