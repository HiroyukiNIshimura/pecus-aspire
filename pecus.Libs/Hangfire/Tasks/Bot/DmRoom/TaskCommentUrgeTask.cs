using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Guards;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスクコメントで Urge（督促）が投稿された際にDMへ通知する Hangfire タスク
/// SystemBot がタスク担当者へのDMでメッセージを送信する
/// </summary>
public class TaskCommentUrgeTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<TaskCommentUrgeTask> _logger;
    private readonly IBotTaskGuard _taskGuard;

    /// <summary>
    /// TaskCommentUrgeTask のコンストラクタ
    /// </summary>
    public TaskCommentUrgeTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<TaskCommentUrgeTask> logger,
        IBotTaskGuard taskGuard)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
        _taskGuard = taskGuard;
    }

    /// <summary>
    /// Urge コメントに対するDM通知を送信する
    /// </summary>
    /// <param name="commentId">タスクコメントID</param>
    public async Task SendUrgeNotificationAsync(int commentId)
    {
        DB.Models.Bot? systemBot = null;
        int organizationId = 0;

        try
        {
            var comment = await _context.TaskComments
                .Include(c => c.User)
                .Include(c => c.WorkspaceTask)
                    .ThenInclude(t => t.WorkspaceItem)
                        .ThenInclude(i => i!.Workspace)
                .Include(c => c.WorkspaceTask)
                    .ThenInclude(t => t.AssignedUser)
                        .ThenInclude(u => u.ChatActor)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null)
            {
                _logger.LogWarning(
                    "TaskComment not found: CommentId={CommentId}",
                    commentId);
                return;
            }

            if (comment.CommentType != TaskCommentType.Urge)
            {
                _logger.LogDebug(
                    "TaskComment is not Urge type, skipping: CommentId={CommentId}, Type={Type}",
                    commentId,
                    comment.CommentType);
                return;
            }

            var task = comment.WorkspaceTask;
            var item = task?.WorkspaceItem;
            var workspace = item?.Workspace;

            if (workspace == null || task == null || item == null)
            {
                _logger.LogWarning(
                    "Workspace, Task, or Item not found for comment: CommentId={CommentId}",
                    commentId);
                return;
            }

            organizationId = workspace.OrganizationId;

            var commentUserId = comment.UserId;
            var taskAssignedUserId = task.AssignedUserId;

            if (commentUserId == taskAssignedUserId)
            {
                _logger.LogDebug(
                    "Comment creator is the same as task assignee, skipping: CommentId={CommentId}, UserId={UserId}",
                    commentId,
                    commentUserId);
                return;
            }

            systemBot = await GetSystemBotAsync(organizationId);
            if (systemBot?.ChatActor == null)
            {
                _logger.LogWarning(
                    "SystemBot not found for organization: OrganizationId={OrganizationId}",
                    organizationId);
                return;
            }

            var commentUserName = comment.User?.Username ?? "不明なユーザー";
            var workspaceCode = workspace.Code ?? workspace.Name;
            var itemCode = item.Code;
            var taskSequence = task.Sequence;

            var messageContent = BuildNotificationMessage(
                commentUserName,
                workspaceCode,
                itemCode,
                taskSequence);

            await SendDmToUserAsync(
                organizationId,
                taskAssignedUserId,
                systemBot,
                messageContent);

            _logger.LogInformation(
                "Urge notification sent: CommentId={CommentId}, TargetUserId={TargetUserId}",
                commentId,
                taskAssignedUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "TaskCommentUrgeTask failed: CommentId={CommentId}",
                commentId);

            throw;
        }
    }

    /// <summary>
    /// 通知メッセージを生成する
    /// </summary>
    private static string BuildNotificationMessage(
        string userName,
        string workspaceCode,
        string itemCode,
        int taskSequence)
    {
        return $"{userName}さんから督促コメントがタスクで作成されました。[{workspaceCode}#{itemCode}T{taskSequence}]";
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
    /// 指定ユーザーへDMを送信する
    /// </summary>
    private async Task SendDmToUserAsync(
        int organizationId,
        int targetUserId,
        DB.Models.Bot systemBot,
        string messageContent)
    {
        var dmRoom = await GetOrCreateDmRoomAsync(organizationId, targetUserId, systemBot);
        if (dmRoom == null)
        {
            _logger.LogWarning(
                "Failed to get or create DM room: TargetUserId={TargetUserId}",
                targetUserId);
            return;
        }

        await _publisher.PublishChatBotTypingAsync(
            organizationId,
            dmRoom.Id,
            systemBot.ChatActor!.Id,
            systemBot.Name,
            isTyping: true);

        await SendBotMessageAsync(organizationId, dmRoom, systemBot, messageContent);

        await _publisher.PublishChatBotTypingAsync(
            organizationId,
            dmRoom.Id,
            systemBot.ChatActor.Id,
            systemBot.Name,
            isTyping: false);

        _logger.LogDebug(
            "Urge DM sent: TargetUserId={TargetUserId}, RoomId={RoomId}",
            targetUserId,
            dmRoom.Id);
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