using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム関連の通知タスクの抽象基底クラス
/// 共通のメソッドを提供し、継承クラスで具体的な通知処理を実装する
/// </summary>
public abstract class ItemNotificationTaskBase
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
    /// ItemNotificationTaskBase のコンストラクタ
    /// </summary>
    protected ItemNotificationTaskBase(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger logger)
    {
        Context = context;
        Publisher = publisher;
        Logger = logger;
    }

    /// <summary>
    /// アイテムを取得する（Workspace と UpdatedByUser を含む）
    /// </summary>
    /// <param name="itemId">アイテムID</param>
    /// <returns>取得したアイテム、見つからない場合は null</returns>
    protected async Task<WorkspaceItem?> GetItemWithDetailsAsync(int itemId)
    {
        return await Context.WorkspaceItems
            .Include(i => i.Workspace)
            .Include(i => i.UpdatedByUser)
            .FirstOrDefaultAsync(i => i.Id == itemId);
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

        // ルームの UpdatedAt を更新
        room.UpdatedAt = DateTimeOffset.UtcNow;

        await Context.SaveChangesAsync();

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
    /// <param name="item">アイテム</param>
    /// <param name="updatedByUserName">更新者名</param>
    /// <param name="workspaceCode">ワークスペースコード</param>
    /// <returns>メッセージ内容</returns>
    protected abstract string BuildNotificationMessage(
        int organizationId,
        WorkspaceItem item,
        string updatedByUserName,
        string workspaceCode,
        string? details);

    /// <summary>
    /// タスク名を取得する（ログ出力用、継承クラスで実装）
    /// </summary>
    protected abstract string TaskName { get; }

    /// <summary>
    /// アイテム通知の共通処理を実行する
    /// </summary>
    /// <param name="itemId">アイテムID</param>
    protected async Task ExecuteNotificationAsync(int itemId, string? details)
    {
        DB.Models.Bot? systemBot = null;
        ChatRoom? room = null;
        int organizationId = 0;

        try
        {
            // アイテムを取得（Workspace と UpdatedByUser を含む）
            var item = await GetItemWithDetailsAsync(itemId);

            if (item == null)
            {
                Logger.LogWarning(
                    "WorkspaceItem not found: ItemId={ItemId}",
                    itemId
                );
                return;
            }

            if (item.Workspace == null)
            {
                Logger.LogWarning(
                    "Workspace not found for item: ItemId={ItemId}",
                    itemId
                );
                return;
            }

            organizationId = item.Workspace.OrganizationId;
            var workspaceCode = item.Workspace.Code ?? item.Workspace.Name;
            var updatedByUser = item.UpdatedByUser?.Username ?? "不明なユーザー";

            // ワークスペースのグループチャットルームを取得
            room = await GetWorkspaceGroupChatRoomAsync(item.WorkspaceId);

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
            var messageContent = BuildNotificationMessage(organizationId, item, updatedByUser, workspaceCode, details);
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
                "{TaskName} failed: ItemId={ItemId}",
                TaskName,
                itemId
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