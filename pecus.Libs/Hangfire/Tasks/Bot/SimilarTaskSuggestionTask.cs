using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Services;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// 類似タスク担当者提案タスク
/// 新規タスク作成時に、類似のタスクを完了した経験者をDMで提案する
/// </summary>
public class SimilarTaskSuggestionTask
{
    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly ITaskAssignmentSuggester _taskAssignmentSuggester;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<SimilarTaskSuggestionTask> _logger;

    /// <summary>
    /// SimilarTaskSuggestionTask のコンストラクタ
    /// </summary>
    public SimilarTaskSuggestionTask(
        ApplicationDbContext context,
        IAiClientFactory aiClientFactory,
        ITaskAssignmentSuggester taskAssignmentSuggester,
        SignalRNotificationPublisher publisher,
        ILogger<SimilarTaskSuggestionTask> logger)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
        _taskAssignmentSuggester = taskAssignmentSuggester;
        _publisher = publisher;
        _logger = logger;
    }

    /// <summary>
    /// 類似タスクの経験者を提案するメッセージを送信する
    /// </summary>
    /// <param name="taskId">タスクID</param>
    public async Task SuggestSimilarTaskAssigneesAsync(int taskId)
    {
        DB.Models.Bot? systemBot = null;
        ChatRoom? dmRoom = null;
        int organizationId = 0;

        try
        {
            var task = await _context.WorkspaceTasks
                .Include(t => t.WorkspaceItem)
                .Include(t => t.Workspace)
                .Include(t => t.AssignedUser)
                    .ThenInclude(u => u.ChatActor)
                .Include(t => t.TaskType)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                _logger.LogWarning(
                    "WorkspaceTask not found: TaskId={TaskId}",
                    taskId);
                return;
            }

            if (task.Workspace == null || task.WorkspaceItem == null)
            {
                _logger.LogWarning(
                    "Workspace or WorkspaceItem not found for task: TaskId={TaskId}",
                    taskId);
                return;
            }

            if (task.AssignedUser?.ChatActor == null)
            {
                _logger.LogWarning(
                    "AssignedUser or ChatActor not found for task: TaskId={TaskId}, AssignedUserId={AssignedUserId}",
                    taskId,
                    task.AssignedUserId);
                return;
            }

            organizationId = task.OrganizationId;

            var setting = await GetOrganizationSettingAsync(organizationId);
            if (setting == null ||
                setting.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting.GenerativeApiModel))
            {
                _logger.LogDebug(
                    "GenerativeApi not configured for organization: OrganizationId={OrganizationId}",
                    organizationId);
                return;
            }

            var aiClient = _aiClientFactory.CreateClient(
                setting.GenerativeApiVendor,
                setting.GenerativeApiKey,
                setting.GenerativeApiModel);

            if (aiClient == null)
            {
                _logger.LogWarning(
                    "Failed to create AI client: OrganizationId={OrganizationId}",
                    organizationId);
                return;
            }

            var suggestions = await _taskAssignmentSuggester.SuggestAssigneesAsync(
                aiClient,
                organizationId,
                task.TaskTypeId,
                task.Content,
                limit: 1);

            if (suggestions.Count == 0)
            {
                _logger.LogDebug(
                    "No similar task suggestions found: TaskId={TaskId}",
                    taskId);
                return;
            }

            var topSuggestion = suggestions[0];

            if (topSuggestion.UserId == task.AssignedUserId)
            {
                _logger.LogDebug(
                    "Top suggestion is the same as assigned user, skipping: TaskId={TaskId}, UserId={UserId}",
                    taskId,
                    topSuggestion.UserId);
                return;
            }

            var suggestedTask = await GetMostRecentSimilarTaskAsync(
                organizationId,
                task.TaskTypeId,
                topSuggestion.UserId);

            if (suggestedTask == null)
            {
                _logger.LogDebug(
                    "Could not find recent similar task for suggested user: UserId={UserId}",
                    topSuggestion.UserId);
                return;
            }

            systemBot = await GetSystemBotAsync(organizationId);
            if (systemBot?.ChatActor == null)
            {
                _logger.LogWarning(
                    "SystemBot not found: OrganizationId={OrganizationId}",
                    organizationId);
                return;
            }

            dmRoom = await GetOrCreateDmRoomAsync(
                organizationId,
                task.AssignedUserId,
                systemBot);

            if (dmRoom == null)
            {
                _logger.LogWarning(
                    "Failed to get or create DM room: AssignedUserId={AssignedUserId}",
                    task.AssignedUserId);
                return;
            }

            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                dmRoom.Id,
                systemBot.ChatActor.Id,
                systemBot.Name,
                isTyping: true);

            var messageContent = BuildSuggestionMessage(
                topSuggestion.DisplayName,
                suggestedTask.Workspace?.Code ?? suggestedTask.Workspace?.Name ?? "Unknown",
                suggestedTask.WorkspaceItem?.Code.ToString() ?? "0",
                suggestedTask.Sequence);

            await SendBotMessageAsync(organizationId, dmRoom, systemBot, messageContent);

            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                dmRoom.Id,
                systemBot.ChatActor.Id,
                systemBot.Name,
                isTyping: false);

            _logger.LogInformation(
                "Similar task suggestion sent: TaskId={TaskId}, SuggestedUserId={SuggestedUserId}, DmRoomId={DmRoomId}",
                taskId,
                topSuggestion.UserId,
                dmRoom.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "SimilarTaskSuggestionTask failed: TaskId={TaskId}",
                taskId);

            if (systemBot?.ChatActor != null && dmRoom != null)
            {
                try
                {
                    await _publisher.PublishChatBotTypingAsync(
                        organizationId,
                        dmRoom.Id,
                        systemBot.ChatActor.Id,
                        systemBot.Name,
                        isTyping: false);
                }
                catch (Exception notifyEx)
                {
                    _logger.LogError(
                        notifyEx,
                        "Failed to send typing end notification: RoomId={RoomId}",
                        dmRoom.Id);
                }
            }

            throw;
        }
    }

    /// <summary>
    /// 提案メッセージを生成する
    /// </summary>
    private static string BuildSuggestionMessage(
        string suggestedUserName,
        string workspaceCode,
        string itemCode,
        int taskSequence)
    {
        return $"過去に{suggestedUserName}さんが似たような作業[{workspaceCode}#{itemCode}T{taskSequence}]をしています。相談してみてはいかがでしょうか？";
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
    /// 指定ユーザーの最近の類似タスクを取得する
    /// </summary>
    private async Task<WorkspaceTask?> GetMostRecentSimilarTaskAsync(
        int organizationId,
        int taskTypeId,
        int userId)
    {
        return await _context.WorkspaceTasks
            .Include(t => t.Workspace)
            .Include(t => t.WorkspaceItem)
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.TaskTypeId == taskTypeId)
            .Where(t => t.AssignedUserId == userId)
            .Where(t => t.IsCompleted)
            .OrderByDescending(t => t.CompletedAt)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// DM ルームを取得または作成する（Bot と指定ユーザー間）
    /// </summary>
    private async Task<ChatRoom?> GetOrCreateDmRoomAsync(
        int organizationId,
        int targetUserId,
        DB.Models.Bot systemBot)
    {
        var targetUser = await _context.Users
            .Include(u => u.ChatActor)
            .FirstOrDefaultAsync(u => u.Id == targetUserId);

        if (targetUser?.ChatActor == null)
        {
            _logger.LogWarning(
                "Target user or ChatActor not found: UserId={UserId}",
                targetUserId);
            return null;
        }

        var existingRoom = await _context.ChatRooms
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r =>
                r.OrganizationId == organizationId &&
                r.Type == ChatRoomType.Ai &&
                r.Members.Any(m => m.ChatActorId == targetUser.ChatActor.Id));

        if (existingRoom != null)
        {
            await EnsureBotIsMemberAsync(existingRoom.Id, systemBot.ChatActor!.Id);
            return existingRoom;
        }

        var room = new ChatRoom
        {
            Type = ChatRoomType.Ai,
            OrganizationId = organizationId,
            CreatedByUserId = targetUserId,
            Members =
            [
                new ChatRoomMember
                {
                    ChatActorId = targetUser.ChatActor.Id,
                    Role = ChatRoomRole.Member
                },
                new ChatRoomMember
                {
                    ChatActorId = systemBot.ChatActor!.Id,
                    Role = ChatRoomRole.Member
                }
            ]
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "AI chat room created for DM: RoomId={RoomId}, UserId={UserId}",
            room.Id,
            targetUserId);

        return room;
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
                chatActorId);
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
        var message = new ChatMessage
        {
            ChatRoomId = room.Id,
            SenderActorId = systemBot.ChatActor!.Id,
            MessageType = ChatMessageType.Text,
            Content = content,
        };
        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        // ルームの UpdatedAt を更新（後勝ち、RowVersion 競合回避）
        await _context.ChatRooms
            .Where(r => r.Id == room.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));

        var payload = BotTaskUtils.BuildMessagePayload(room, message, systemBot);

        await _publisher.PublishChatBotNotificationAsync(
            organizationId,
            room.Id,
            "chat:message_received",
            payload);

        await _publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:unread_updated",
            Payload = BotTaskUtils.BuildUnreadUpdatedPayload(room, systemBot.ChatActor.Id),
            SourceType = NotificationSourceType.ChatBot,
            OrganizationId = organizationId,
        });
    }
}