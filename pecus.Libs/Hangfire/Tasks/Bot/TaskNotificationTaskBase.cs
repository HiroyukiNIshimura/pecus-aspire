using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスク関連の通知タスクの抽象基底クラス
/// 共通のメソッドを提供し、継承クラスで具体的な通知処理を実装する
/// </summary>
public abstract class TaskNotificationTaskBase
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
    /// ロガー
    /// </summary>
    protected readonly ILogger Logger;

    /// <summary>
    /// TaskNotificationTaskBase のコンストラクタ
    /// </summary>
    protected TaskNotificationTaskBase(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger logger)
    {
        Context = context;
        Publisher = publisher;
        Logger = logger;
    }

    /// <summary>
    /// タスクを取得する（WorkspaceItem, Workspace, CreatedByUser を含む）
    /// </summary>
    /// <param name="taskId">タスクID</param>
    /// <returns>取得したタスク、見つからない場合は null</returns>
    protected async Task<WorkspaceTask?> GetTaskWithDetailsAsync(int taskId)
    {
        return await Context.WorkspaceTasks
            .Include(t => t.WorkspaceItem)
            .Include(t => t.Workspace)
            .Include(t => t.CreatedByUser)
            .FirstOrDefaultAsync(t => t.Id == taskId);
    }

    /// <summary>
    /// ワークスペースのグループチャットルームを取得する
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <returns>グループチャットルーム、見つからない場合は null</returns>
    protected async Task<ChatRoom?> GetWorkspaceGroupChatRoomAsync(int workspaceId)
    {
        return await Context.ChatRooms.FirstOrDefaultAsync(r =>
            r.WorkspaceId == workspaceId && r.Type == ChatRoomType.Group);
    }

    /// <summary>
    /// SystemBot を取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>SystemBot、見つからない場合は null</returns>
    protected async Task<DB.Models.Bot?> GetSystemBotAsync(int organizationId)
    {
        return await Context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == BotType.SystemBot);
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
                "SystemBot added to room: RoomId={RoomId}, ChatActorId={ChatActorId}",
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
    /// <param name="systemBot">SystemBot</param>
    /// <param name="content">メッセージ内容</param>
    protected async Task SendBotMessageAsync(
        int organizationId,
        ChatRoom room,
        DB.Models.Bot systemBot,
        string content)
    {
        // メッセージを作成
        var message = new ChatMessage
        {
            ChatRoomId = room.Id,
            SenderActorId = systemBot.ChatActor!.Id,
            MessageType = ChatMessageType.Text,
            Content = content,
        };
        Context.ChatMessages.Add(message);
        await Context.SaveChangesAsync();

        // ルームの UpdatedAt を更新（後勝ち、RowVersion 競合回避）
        await Context.ChatRooms
            .Where(r => r.Id == room.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));

        // SignalR 通知を送信（Redis Pub/Sub 経由）
        var payload = BotTaskUtils.BuildMessagePayload(room, message, systemBot);

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
            Payload = BotTaskUtils.BuildUnreadUpdatedPayload(room, systemBot.ChatActor.Id),
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
    /// 通知メッセージの内容を生成する（継承クラスで実装）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="task">タスク</param>
    /// <param name="userName">ユーザー名</param>
    /// <param name="workspaceCode">ワークスペースコード</param>
    /// <returns>メッセージ内容</returns>
    protected abstract string BuildNotificationMessage(
        int organizationId,
        WorkspaceTask task,
        string userName,
        string workspaceCode);

    /// <summary>
    /// 通知メッセージの内容を非同期で生成する（継承クラスでオーバーライド可能）
    /// デフォルトでは BuildNotificationMessage を呼び出す
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="task">タスク</param>
    /// <param name="userName">ユーザー名</param>
    /// <param name="workspaceCode">ワークスペースコード</param>
    /// <returns>メッセージ内容</returns>
    protected virtual Task<string> BuildNotificationMessageAsync(
        int organizationId,
        WorkspaceTask task,
        string userName,
        string workspaceCode)
    {
        return Task.FromResult(BuildNotificationMessage(organizationId, task, userName, workspaceCode));
    }

    /// <summary>
    /// タスク名を取得する（ログ出力用、継承クラスで実装）
    /// </summary>
    protected abstract string TaskName { get; }

    /// <summary>
    /// タスク通知の共通処理を実行する
    /// </summary>
    /// <param name="taskId">タスクID</param>
    protected async Task ExecuteNotificationAsync(int taskId)
    {
        DB.Models.Bot? systemBot = null;
        ChatRoom? room = null;
        int organizationId = 0;

        try
        {
            // タスクを取得（WorkspaceItem, Workspace, CreatedByUser を含む）
            var task = await GetTaskWithDetailsAsync(taskId);

            if (task == null)
            {
                Logger.LogWarning(
                    "WorkspaceTask not found: TaskId={TaskId}",
                    taskId
                );
                return;
            }

            if (task.Workspace == null)
            {
                Logger.LogWarning(
                    "Workspace not found for task: TaskId={TaskId}",
                    taskId
                );
                return;
            }

            if (task.WorkspaceItem == null)
            {
                Logger.LogWarning(
                    "WorkspaceItem not found for task: TaskId={TaskId}",
                    taskId
                );
                return;
            }

            organizationId = task.OrganizationId;
            var workspaceCode = task.Workspace.Code ?? task.Workspace.Name;
            var userName = task.CreatedByUser?.Username ?? "不明なユーザー";

            // ワークスペースのグループチャットルームを取得
            room = await GetWorkspaceGroupChatRoomAsync(task.WorkspaceId);

            if (room == null)
            {
                return;
            }

            // SystemBot を取得
            systemBot = await GetSystemBotAsync(organizationId);
            if (systemBot?.ChatActor == null)
            {
                Logger.LogWarning(
                    "SystemBot not found for organization: OrganizationId={OrganizationId}",
                    organizationId
                );
                return;
            }

            // SystemBot がルームのメンバーか確認し、メンバーでなければ追加
            await EnsureBotIsMemberAsync(room.Id, systemBot.ChatActor.Id);

            // 入力開始を通知
            await Publisher.PublishChatBotTypingAsync(
                organizationId,
                room.Id,
                systemBot.ChatActor.Id,
                systemBot.Name,
                isTyping: true
            );

            // メッセージを作成してグループチャットに送信
            var messageContent = await BuildNotificationMessageAsync(organizationId, task, userName, workspaceCode);
            await SendBotMessageAsync(organizationId, room, systemBot, messageContent);

            // 入力終了を通知
            await Publisher.PublishChatBotTypingAsync(
                organizationId,
                room.Id,
                systemBot.ChatActor.Id,
                systemBot.Name,
                isTyping: false
            );
        }
        catch (Exception ex)
        {
            Logger.LogError(
                ex,
                "{TaskName} failed: TaskId={TaskId}",
                TaskName,
                taskId
            );

            // エラー時も入力終了を通知
            if (systemBot?.ChatActor != null && room != null)
            {
                try
                {
                    await Publisher.PublishChatBotTypingAsync(
                        organizationId,
                        room.Id,
                        systemBot.ChatActor.Id,
                        systemBot.Name,
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