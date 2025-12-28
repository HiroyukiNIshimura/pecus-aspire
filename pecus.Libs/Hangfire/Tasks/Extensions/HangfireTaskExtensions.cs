using Microsoft.Extensions.DependencyInjection;
using Pecus.Libs.Hangfire.Tasks.Bot;

namespace Pecus.Libs.Hangfire.Tasks.Extensions;

/// <summary>
/// Hangfire タスクの DI 登録拡張
/// </summary>
public static class HangfireTaskExtensions
{
    /// <summary>
    /// 全ての Hangfire タスクを登録する
    /// </summary>
    public static IServiceCollection AddHangfireTasks(this IServiceCollection services)
    {
        // 基本タスク
        services.AddScoped<ActivityTasks>();
        services.AddScoped<EmailTasks>();
        services.AddScoped<ImageTasks>();
        services.AddScoped<CleanupTasks>();
        services.AddScoped<UploadsCleanupTasks>();

        // ワークスペース関連
        services.AddScoped<WorkspaceItemTasks>();
        services.AddScoped<FirstTouchdownTask>();

        // AI/Bot 関連
        services.AddSingleton<IRoomReplyLock, RedisRoomReplyLock>();
        services.AddScoped<AiChatReplyTask>();
        services.AddScoped<GroupChatReplyTask>();

        // アイテム作成・更新
        services.AddScoped<CreateItemTask>();
        services.AddScoped<UpdateItemTask>();
        services.AddScoped<CreateTaskTask>();
        services.AddScoped<UpdateTaskTask>();

        // 通知・リマインダー
        services.AddScoped<MaintenanceNotificationTask>();
        services.AddScoped<SystemNotificationDeliveryTask>();
        services.AddScoped<SimilarTaskSuggestionTask>();
        services.AddScoped<TaskCommentHelpWantedTask>();
        services.AddScoped<TaskCommentUrgeTask>();
        services.AddScoped<TaskCommentReminderTask>();
        services.AddScoped<TaskCommentReminderFireTask>();

        return services;
    }
}
