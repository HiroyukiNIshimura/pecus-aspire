using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム更新時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class UpdateItemTask : ItemNotificationTaskBase
{
    /// <summary>
    /// UpdateItemTask のコンストラクタ
    /// </summary>
    public UpdateItemTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<UpdateItemTask> logger)
        : base(context, publisher, logger)
    {
    }

    /// <inheritdoc />
    protected override string TaskName => "UpdateItemTask";

    /// <inheritdoc />
    protected override string BuildNotificationMessage(
        int organizationId,
        WorkspaceItem item,
        string updatedByUserName,
        string workspaceCode,
        string? details)
    {
        return $"{updatedByUserName}さんがアイテムの内容を更新しました。\n[{workspaceCode}#{item.Code}]";
    }

    /// <summary>
    /// アイテム更新時のメッセージ通知を実行する
    /// </summary>
    /// <param name="itemId">更新されたアイテムのID</param>
    /// <param name="details">変更内容</param>
    public async Task NotifyItemUpdatedAsync(int itemId, string? details)
    {
        await ExecuteNotificationAsync(itemId, details);
    }
}