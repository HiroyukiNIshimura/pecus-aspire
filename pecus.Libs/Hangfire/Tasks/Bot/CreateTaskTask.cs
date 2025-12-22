using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスク作成時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class CreateTaskTask : TaskNotificationTaskBase
{
    /// <summary>
    /// CreateTaskTask のコンストラクタ
    /// </summary>
    public CreateTaskTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<CreateTaskTask> logger)
        : base(context, publisher, logger)
    {
    }

    /// <inheritdoc />
    protected override string TaskName => "CreateTaskTask";

    /// <inheritdoc />
    protected override string BuildNotificationMessage(
        WorkspaceTask task,
        string userName,
        string workspaceCode)
    {
        var itemCode = task.WorkspaceItem.Code;
        var taskSequence = task.Sequence;
        return $"{userName}さんがタスクを作成しました。\n[{workspaceCode}#{itemCode}T{taskSequence}]";
    }

    /// <summary>
    /// タスク作成時のメッセージ通知を実行する
    /// </summary>
    /// <param name="taskId">作成されたタスクのID</param>
    public async Task NotifyTaskCreatedAsync(int taskId)
    {
        await ExecuteNotificationAsync(taskId);
    }
}