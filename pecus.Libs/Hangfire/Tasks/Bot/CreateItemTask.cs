using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム作成時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class CreateItemTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<CreateItemTask> _logger;

    /// <summary>
    /// CreateItemTask のコンストラクタ
    /// </summary>
    public CreateItemTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<CreateItemTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
    }

    /// <summary>
    /// アイテム作成時のメッセージ通知を実行する
    /// </summary>
    /// <param name="itemId">作成されたアイテムのID</param>
    public async Task NotifyItemCreatedAsync(int itemId)
    {
        _logger.LogDebug(
            "CreateItemTask started: ItemId={ItemId}",
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
                "CreateItemTask completed: ItemId={ItemId}",
                itemId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "CreateItemTask failed: ItemId={ItemId}",
                itemId
            );
            throw;
        }
    }
}