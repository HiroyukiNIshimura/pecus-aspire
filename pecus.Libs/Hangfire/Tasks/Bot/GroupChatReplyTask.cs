using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// グループチャット投稿時に Bot が返信を生成する Hangfire タスク
/// ユーザーからのメッセージに対してワークスペースグループチャットに返信を送信する
/// </summary>
public class GroupChatReplyTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<GroupChatReplyTask> _logger;

    /// <summary>
    /// GroupChatReplyTask のコンストラクタ
    /// </summary>
    public GroupChatReplyTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<GroupChatReplyTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
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
        _logger.LogDebug(
            "GroupChatReplyTask started: OrganizationId={OrganizationId}, RoomId={RoomId}, TriggerMessageId={TriggerMessageId}, SenderUserId={SenderUserId}",
            organizationId,
            roomId,
            triggerMessageId,
            senderUserId
        );

        try
        {
            // TODO: 1. チャットルームを取得
            // TODO: 2. ワークスペース情報を取得
            // TODO: 3. Bot 設定を取得
            // TODO: 4. メッセージ作成が必要か判定
            // TODO: 5. 必要であれば返信メッセージを作成
            // TODO: 6. SignalR でリアルタイム通知

            _logger.LogDebug(
                "GroupChatReplyTask completed: OrganizationId={OrganizationId}, RoomId={RoomId}",
                organizationId,
                roomId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "GroupChatReplyTask failed: OrganizationId={OrganizationId}, RoomId={RoomId}, TriggerMessageId={TriggerMessageId}",
                organizationId,
                roomId,
                triggerMessageId
            );
            throw;
        }
    }
}