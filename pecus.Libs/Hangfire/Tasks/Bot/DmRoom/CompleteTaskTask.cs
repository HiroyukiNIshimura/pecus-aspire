using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Prompts;
using Pecus.Libs.AI.Prompts.Notifications;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Guards;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスク完了時に担当者のDMへ祝福メッセージを通知する Hangfire タスク
/// ランダムに選択されたBotから担当者へDMを送信する
/// </summary>
public class CompleteTaskTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<CompleteTaskTask> _logger;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly IBotSelector _botSelector;
    private readonly IBotTaskGuard _taskGuard;
    private readonly TaskCompletedPromptTemplate _promptTemplate = new();

    /// <summary>
    /// CompleteTaskTask のコンストラクタ
    /// </summary>
    public CompleteTaskTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<CompleteTaskTask> logger,
        IAiClientFactory aiClientFactory,
        IBotSelector botSelector,
        IBotTaskGuard taskGuard)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
        _aiClientFactory = aiClientFactory;
        _botSelector = botSelector;
        _taskGuard = taskGuard;
    }

    /// <summary>
    /// タスク完了時の祝福メッセージ通知を実行する
    /// </summary>
    /// <param name="taskId">完了したタスクのID</param>
    public async Task NotifyTaskCompletedAsync(int taskId)
    {
        DB.Models.Bot? selectedBot = null;
        int organizationId = 0;

        try
        {
            var (isBotEnabled, signature) = await _taskGuard.IsBotEnabledAsync(organizationId);
            if (!isBotEnabled || signature == null)
            {
                _logger.LogInformation(
                    "Bot is disabled for OrganizationId={OrganizationId}, skipping AI reply",
                    organizationId
                );
                return;
            }

            var task = await _context.WorkspaceTasks
                .Include(t => t.WorkspaceItem)
                    .ThenInclude(i => i.Workspace)
                .Include(t => t.AssignedUser)
                .Include(t => t.CompletedByUser)
                    .ThenInclude(u => u!.ChatActor)
                .Include(t => t.TaskType)
                .AsSplitQuery()
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                _logger.LogWarning(
                    "WorkspaceTask not found: TaskId={TaskId}",
                    taskId);
                return;
            }

            if (!task.IsCompleted)
            {
                _logger.LogDebug(
                    "Task is not completed, skipping: TaskId={TaskId}",
                    taskId);
                return;
            }

            // 完了者に祝福メッセージを送信（完了者がいない場合はスキップ）
            if (task.CompletedByUser == null || task.CompletedByUser.ChatActor == null)
            {
                _logger.LogDebug(
                    "Task has no completed-by user or completed-by user has no ChatActor, skipping: TaskId={TaskId}",
                    taskId);
                return;
            }

            organizationId = task.WorkspaceItem.Workspace!.OrganizationId;

            selectedBot = await SelectRandomBotWithFallbackAsync(organizationId);
            if (selectedBot?.ChatActors.Any() != true)
            {
                _logger.LogWarning(
                    "No bot available for organization: OrganizationId={OrganizationId}",
                    organizationId);
                return;
            }

            var message = await BuildCelebrationMessageAsync(organizationId, task, selectedBot);
            if (string.IsNullOrWhiteSpace(message))
            {
                _logger.LogDebug("No celebration message generated, skipping notification");
                return;
            }

            await SendCelebrationDmAsync(
                organizationId,
                task.CompletedByUser.Id,
                selectedBot,
                message);

            _logger.LogInformation(
                "Task completion celebration sent: TaskId={TaskId}, CompletedByUserId={CompletedByUserId}, BotId={BotId}",
                taskId,
                task.CompletedByUser.Id,
                selectedBot.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send task completion celebration: TaskId={TaskId}, OrganizationId={OrganizationId}, BotId={BotId}",
                taskId,
                organizationId,
                selectedBot?.Id);
        }
    }

    /// <summary>
    /// ランダムにBotを選択し、見つからない場合はSystemBotにフォールバックする
    /// </summary>
    private async Task<DB.Models.Bot?> SelectRandomBotWithFallbackAsync(int organizationId)
    {
        if (_botSelector == null)
        {
            _logger.LogDebug("BotSelector is not available, falling back to SystemBot");
            return await GetSystemBotAsync(organizationId);
        }

        var randomBot = await _botSelector.GetRandomBotAsync(organizationId);
        if (randomBot != null)
        {
            _logger.LogDebug(
                "Random bot selected: BotId={BotId}, BotType={BotType}",
                randomBot.Id,
                randomBot.Type);
            return randomBot;
        }

        _logger.LogDebug("No bots found from random selection, falling back to SystemBot");
        return await GetSystemBotAsync(organizationId);
    }

    /// <summary>
    /// SystemBotを取得する
    /// </summary>
    private async Task<DB.Models.Bot?> GetSystemBotAsync(int organizationId)
    {
        return await _context.Bots
            .Include(b => b.ChatActors.Where(ca => ca.OrganizationId == organizationId))
            .FirstOrDefaultAsync(b => b.Type == BotType.SystemBot);
    }

    /// <summary>
    /// 祝福メッセージを生成する
    /// </summary>
    private async Task<string?> BuildCelebrationMessageAsync(
        int organizationId,
        WorkspaceTask task,
        DB.Models.Bot selectedBot)
    {
        var workspace = task.WorkspaceItem.Workspace!;
        var completedByName = task.CompletedByUser?.Username ?? "不明なユーザー";
        var defaultMessage = BuildDefaultMessage(
            completedByName,
            workspace.Code ?? "",
            task.WorkspaceItem.Code,
            task.Sequence);

        if (_aiClientFactory == null)
        {
            _logger.LogDebug("AiClientFactory is not available, using default message");
            return defaultMessage;
        }

        try
        {
            var setting = await _context.OrganizationSettings
                .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

            if (setting == null ||
                setting.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting.GenerativeApiModel))
            {
                _logger.LogDebug("AI settings not configured for organization, using default message");
                return defaultMessage;
            }

            var aiClient = _aiClientFactory.CreateClient(
                setting.GenerativeApiVendor,
                setting.GenerativeApiKey,
                setting.GenerativeApiModel);

            if (aiClient == null)
            {
                _logger.LogDebug("Failed to create AI client, using default message");
                return defaultMessage;
            }

            var taskTypeName = task.TaskType?.Name ?? "タスク";
            var promptInput = new TaskCompletedPromptInput(
                CompletedByName: completedByName,
                TaskTypeName: taskTypeName,
                ItemSubject: task.WorkspaceItem.Subject,
                WorkspaceName: workspace.Name);

            var prompt = _promptTemplate.Build(promptInput);

            var botPersonaPrompt = new SystemPromptBuilder()
                .WithRawPersona(selectedBot.Persona)
                .WithRawConstraint(selectedBot.Constraint)
                .Build();
            var fullSystemPrompt = $"{prompt.SystemPrompt}\n\n{botPersonaPrompt}";

            var generatedMessage = await aiClient.GenerateTextAsync(fullSystemPrompt, prompt.UserPrompt);

            if (string.IsNullOrWhiteSpace(generatedMessage))
            {
                _logger.LogDebug("AI generated empty message, using default message");
                return defaultMessage;
            }

            if (generatedMessage.Length > 80)
            {
                generatedMessage = generatedMessage[..77] + "...";
            }

            return generatedMessage;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate AI celebration message, using default message");
            return defaultMessage;
        }
    }

    /// <summary>
    /// 定型の祝福メッセージを生成する
    /// </summary>
    private static string BuildDefaultMessage(
        string completedByName,
        string workspaceCode,
        string itemCode,
        int taskSequence)
    {
        return $"{completedByName}さん、タスク完了おめでとうございます！ [{workspaceCode}#{itemCode}T{taskSequence}]";
    }

    /// <summary>
    /// 完了者へ祝福DMを送信する
    /// </summary>
    private async Task SendCelebrationDmAsync(
        int organizationId,
        int targetUserId,
        DB.Models.Bot selectedBot,
        string message)
    {
        var dmRoom = await GetOrCreateDmRoomAsync(organizationId, targetUserId, selectedBot);
        if (dmRoom == null)
        {
            _logger.LogWarning(
                "Failed to get or create DM room: TargetUserId={TargetUserId}",
                targetUserId);
            return;
        }

        await SendBotMessageAsync(organizationId, dmRoom, selectedBot, message);

        _logger.LogDebug(
            "Celebration DM sent: TargetUserId={TargetUserId}, RoomId={RoomId}",
            targetUserId,
            dmRoom.Id);
    }

    /// <summary>
    /// DM ルームを取得または作成する（Bot と指定ユーザー間）
    /// </summary>
    private async Task<ChatRoom?> GetOrCreateDmRoomAsync(
        int organizationId,
        int targetUserId,
        DB.Models.Bot selectedBot)
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

        // CreatedByUserId で検索（ChatRoomService.GetOrCreateAiRoomAsync と同じ条件）
        var existingRoom = await _context.ChatRooms
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r =>
                r.OrganizationId == organizationId &&
                r.Type == ChatRoomType.Ai &&
                r.CreatedByUserId == targetUserId);

        if (existingRoom != null)
        {
            await EnsureBotIsMemberAsync(existingRoom.Id, selectedBot.GetChatActorId());
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
                    ChatActorId = selectedBot.GetChatActorId(),
                    Role = ChatRoomRole.Member
                }
            ]
        };

        _context.ChatRooms.Add(room);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "AI chat room created for celebration DM: RoomId={RoomId}, UserId={UserId}",
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
        DB.Models.Bot selectedBot,
        string content)
    {
        var message = new ChatMessage
        {
            ChatRoomId = room.Id,
            SenderActorId = selectedBot.GetChatActorId(),
            MessageType = ChatMessageType.Text,
            Content = content,
        };
        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        await _context.ChatRooms
            .Where(r => r.Id == room.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));

        var payload = BotTaskUtils.BuildMessagePayload(room, message, selectedBot);

        await _publisher.PublishChatBotNotificationAsync(
            organizationId,
            room.Id,
            "chat:message_received",
            payload);

        await _publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:unread_updated",
            Payload = BotTaskUtils.BuildUnreadUpdatedPayload(room, selectedBot.GetChatActorId()),
            SourceType = NotificationSourceType.ChatBot,
            OrganizationId = organizationId,
        });
    }
}
