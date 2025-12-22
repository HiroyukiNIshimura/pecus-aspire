using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスク更新時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class UpdateTaskTask
{
    private readonly ApplicationDbContext _context;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<UpdateTaskTask> _logger;

    /// <summary>
    /// UpdateTaskTask のコンストラクタ
    /// </summary>
    public UpdateTaskTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<UpdateTaskTask> logger)
    {
        _context = context;
        _publisher = publisher;
        _logger = logger;
    }

    /// <summary>
    /// タスク更新時のメッセージ通知を実行する
    /// </summary>
    /// <param name="taskId">更新されたタスクのID</param>
    public async Task NotifyTaskUpdatedAsync(int taskId)
    {
        _logger.LogDebug(
            "UpdateTaskTask started: TaskId={TaskId}",
            taskId
        );

        try
        {
            // TODO: 1. タスクを取得
            // TODO: 2. タスクに関連するワークスペースを取得
            // TODO: 3. ワークスペースのグループチャットルームを取得
            // TODO: 4. メッセージ作成が必要か判定
            // TODO: 5. 必要であればメッセージを作成してグループチャットに送信
            // TODO: 6. SignalR でリアルタイム通知

            _logger.LogDebug(
                "UpdateTaskTask completed: TaskId={TaskId}",
                taskId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "UpdateTaskTask failed: TaskId={TaskId}",
                taskId
            );
            throw;
        }
    }
}