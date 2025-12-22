using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// グループチャット投稿時に Bot が返信を生成する Hangfire タスク
/// ユーザーからのメッセージに対してワークスペースグループチャットに返信を送信する
/// </summary>
public class GroupChatReplyTask : GroupChatReplyTaskBase
{
    /// <summary>
    /// GroupChatReplyTask のコンストラクタ
    /// </summary>
    public GroupChatReplyTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<GroupChatReplyTask> logger)
        : base(context, publisher, logger)
    {
    }

    /// <inheritdoc />
    protected override string TaskName => "GroupChatReplyTask";

    /// <inheritdoc />
    protected override BotType BotType => BotType.ChatBot;

    /// <inheritdoc />
    protected override string BuildReplyMessage(
        ChatRoom room,
        ChatMessage triggerMessage,
        User senderUser)
    {
        // TODO: 実際の返信メッセージ生成ロジックを実装
        return "工事中";
    }

    /// <summary>
    /// グループチャットへの返信を実行する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="triggerMessageId">トリガーとなったメッセージID</param>
    /// <param name="senderUserId">メッセージを送信したユーザーのID</param>
    public async Task SendReplyAsync(int organizationId, int roomId, int triggerMessageId, int senderUserId)
    {
        await ExecuteReplyAsync(organizationId, roomId, triggerMessageId, senderUserId);
    }
}