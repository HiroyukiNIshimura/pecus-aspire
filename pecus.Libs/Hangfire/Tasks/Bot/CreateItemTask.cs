using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// アイテム作成時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class CreateItemTask : ItemNotificationTaskBase
{
    /// <summary>
    /// CreateItemTask のコンストラクタ
    /// </summary>
    public CreateItemTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<CreateItemTask> logger)
        : base(context, publisher, logger)
    {
    }

    /// <inheritdoc />
    protected override string TaskName => "CreateItemTask";

    /// <inheritdoc />
    protected override string BuildNotificationMessage(
        int organizationId,
        WorkspaceItem item,
        string updatedByUserName,
        string workspaceCode,
        //detailsはNULLで使用しないため無視
        string? details)
    {
        return $"{updatedByUserName}さんがアイテムを作成しました。\n[{workspaceCode}#{item.Code}]";
    }

    /// <summary>
    /// アイテム作成時のメッセージ通知を実行する
    /// </summary>
    /// <param name="itemId">作成されたアイテムのID</param>
    public async Task NotifyItemCreatedAsync(int itemId)
    {
        await ExecuteNotificationAsync(itemId, null);
    }
}