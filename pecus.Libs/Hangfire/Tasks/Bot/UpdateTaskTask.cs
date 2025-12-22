using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスク更新時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class UpdateTaskTask : TaskNotificationTaskBase
{
    /// <summary>
    /// UpdateTaskTask のコンストラクタ
    /// </summary>
    public UpdateTaskTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<UpdateTaskTask> logger)
        : base(context, publisher, logger)
    {
    }

    /// <inheritdoc />
    protected override string TaskName => "UpdateTaskTask";

    /// <inheritdoc />
    protected override string BuildNotificationMessage(
        WorkspaceTask task,
        string userName,
        string workspaceCode)
    {
        var itemCode = task.WorkspaceItem.Code;
        var taskSequence = task.Sequence;
        return $"{userName}さんがタスクを更新しました。\n[{workspaceCode}#{itemCode}T{taskSequence}]";
    }

    /// <summary>
    /// タスク更新時のメッセージ通知を実行する
    /// </summary>
    /// <param name="taskId">更新されたタスクのID</param>
    public async Task NotifyTaskUpdatedAsync(int taskId)
    {
        await ExecuteNotificationAsync(taskId);
    }
}