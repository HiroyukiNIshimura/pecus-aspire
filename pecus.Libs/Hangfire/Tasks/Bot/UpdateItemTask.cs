using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム更新時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class UpdateItemTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<UpdateItemTask> _logger;

    /// <summary>
    /// UpdateItemTask のコンストラクタ
    /// </summary>
    public UpdateItemTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<UpdateItemTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
    }

    /// <summary>
    /// アイテム更新時のメッセージ通知を実行する
    /// </summary>
    /// <param name="itemId">更新されたアイテムのID</param>
    public async Task NotifyItemUpdatedAsync(int itemId)
    {
        _logger.LogDebug(
            "UpdateItemTask started: ItemId={ItemId}",
            itemId
        );

        try
        {
            // TODO: 1. アイテムを取得
            // TODO: 2. アイテムに関連するワークスペースを取得
            // TODO: 3. ワークスペースのグループチャットルームを取得
            // TODO: 4. メッセージ作成が必要か判定
            // TODO: 5. 必要であればメッセージを作成してグループチャットに送信
            // TODO: 6. SignalR でリアルタイム通知

            _logger.LogDebug(
                "UpdateItemTask completed: ItemId={ItemId}",
                itemId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "UpdateItemTask failed: ItemId={ItemId}",
                itemId
            );
            throw;
        }
    }
}