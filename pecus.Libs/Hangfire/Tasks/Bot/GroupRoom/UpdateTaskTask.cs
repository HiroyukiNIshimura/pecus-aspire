using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Prompts;
using Pecus.Libs.AI.Prompts.Notifications;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Guards;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスク更新時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class UpdateTaskTask : TaskNotificationTaskBase
{
    private readonly TaskUpdatedPromptTemplate _promptTemplate = new();
    private readonly IAiClientFactory? _aiClientFactory;
    private readonly IBotSelector? _botSelector;

    /// <summary>
    /// 現在処理中の変更情報（一時保持用）
    /// </summary>
    private TaskUpdateChanges? _currentChanges;

    /// <summary>
    /// 現在処理中の更新者ID（一時保持用）
    /// </summary>
    private int? _currentUpdaterUserId;

    /// <summary>
    /// UpdateTaskTask のコンストラクタ
    /// </summary>
    public UpdateTaskTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        IBotTaskGuard taskGuard,
        ILogger<UpdateTaskTask> logger,
        IAiClientFactory? aiClientFactory = null,
        IBotSelector? botSelector = null)
        : base(context, publisher, taskGuard, logger)
    {
        _aiClientFactory = aiClientFactory;
        _botSelector = botSelector;
    }

    /// <inheritdoc />
    protected override string TaskName => "UpdateTaskTask";

    /// <inheritdoc />
    protected override string BuildNotificationMessage(
        int organizationId,
        WorkspaceTask task,
        string userName,
        string workspaceCode)
    {
        return BuildDefaultMessage(userName, workspaceCode, task.WorkspaceItem.Code, task.Sequence);
    }

    /// <inheritdoc />
    protected override async Task<(string Message, DB.Models.Bot? SelectedBot)> BuildNotificationMessageAsync(
        int organizationId,
        WorkspaceTask task,
        string userName,
        string workspaceCode)
    {
        // 更新者IDが設定されていれば、更新者の名前を取得して使用
        var effectiveUserName = userName;
        if (_currentUpdaterUserId.HasValue)
        {
            var updater = await Context.Users
                .Where(u => u.Id == _currentUpdaterUserId.Value)
                .Select(u => u.Username)
                .FirstOrDefaultAsync();
            if (!string.IsNullOrEmpty(updater))
            {
                effectiveUserName = updater;
            }
        }

        var defaultMessage = BuildDefaultMessage(effectiveUserName, workspaceCode, task.WorkspaceItem.Code, task.Sequence);

        if (_aiClientFactory == null || _botSelector == null)
        {
            Logger.LogDebug("AiClientFactory or BotSelector is not available, using default message");
            return (defaultMessage, null);
        }

        try
        {
            var setting = await GetOrganizationSettingAsync(organizationId);
            if (setting == null ||
                setting.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting.GenerativeApiModel))
            {
                Logger.LogDebug("AI settings not configured for organization, using default message");
                return (defaultMessage, null);
            }

            var aiClient = _aiClientFactory.CreateClient(
                setting.GenerativeApiVendor,
                setting.GenerativeApiKey,
                setting.GenerativeApiModel
            );

            if (aiClient == null)
            {
                Logger.LogDebug("Failed to create AI client, using default message");
                return (defaultMessage, null);
            }

            var taskTypeName = task.TaskType?.Name ?? "タスク";
            var priorityText = GetPriorityText(task.Priority);
            var dueDateText = GetDueDateText(task.DueDate);

            var contentForAnalysis = $"タスク種類: {taskTypeName}\n優先度: {priorityText}\n期限: {dueDateText}\n内容: {task.Content}";

            var bot = await _botSelector.SelectBotByContentAsync(
                organizationId,
                aiClient,
                contentForAnalysis
            );

            if (bot == null)
            {
                Logger.LogDebug("Bot not found, using default message");
                return (defaultMessage, null);
            }

            // Bot のペルソナと行動指針を プロンプトテンプレート と統合
            var promptInput = new TaskUpdatedPromptInput(
                UserName: effectiveUserName,
                TaskTypeName: taskTypeName,
                PriorityText: priorityText,
                DueDateText: dueDateText,
                ProgressPercentage: task.ProgressPercentage,
                IsCompleted: task.IsCompleted,
                IsDiscarded: task.IsDiscarded,
                Content: task.Content,
                Changes: _currentChanges
            );
            var prompt = _promptTemplate.Build(promptInput);

            var botPersonaPrompt = new SystemPromptBuilder()
                .WithRawPersona(bot.Persona)
                .WithRawConstraint(bot.Constraint)
                .Build();
            var fullSystemPrompt = $"{prompt.SystemPrompt}\n\n{botPersonaPrompt}";

            var generatedMessage = await aiClient.GenerateTextAsync(fullSystemPrompt, prompt.UserPrompt);

            if (string.IsNullOrWhiteSpace(generatedMessage))
            {
                Logger.LogDebug("AI generated empty message, using default message");
                return (defaultMessage, bot);
            }

            if (generatedMessage.Length > 100)
            {
                generatedMessage = generatedMessage[..97] + "...";
            }

            return ($"{defaultMessage}\n\n{generatedMessage}", bot);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to generate AI message for task update, using default message");
            return (defaultMessage, null);
        }
    }

    /// <summary>
    /// タスク更新時のメッセージ通知を実行する
    /// </summary>
    /// <param name="taskId">更新されたタスクのID</param>
    /// <param name="updaterUserId">更新者のユーザーID</param>
    /// <param name="changes">タスクの変更情報（オプション）</param>
    public async Task NotifyTaskUpdatedAsync(int taskId, int updaterUserId, TaskUpdateChanges? changes = null)
    {
        _currentChanges = changes;
        _currentUpdaterUserId = updaterUserId;
        try
        {
            await ExecuteNotificationAsync(taskId);
        }
        finally
        {
            _currentChanges = null;
            _currentUpdaterUserId = null;
        }
    }

    /// <summary>
    /// 定型メッセージを生成する
    /// </summary>
    private static string BuildDefaultMessage(string userName, string workspaceCode, string itemCode, int taskSequence)
    {
        return $"{userName}さんがタスクを更新しました。\n[{workspaceCode}#{itemCode}T{taskSequence}]";
    }

    /// <summary>
    /// 優先度のテキストを取得する
    /// </summary>
    private static string GetPriorityText(TaskPriority? priority)
    {
        return priority switch
        {
            TaskPriority.Low => "低",
            TaskPriority.Medium => "中",
            TaskPriority.High => "高",
            TaskPriority.Critical => "緊急",
            _ => "中"
        };
    }

    /// <summary>
    /// 期限日のテキストを取得する（残り日数を含む）
    /// </summary>
    private static string GetDueDateText(DateTimeOffset dueDate)
    {
        var today = DateTimeOffset.UtcNow.Date;
        var dueDateOnly = dueDate.Date;
        var daysRemaining = (dueDateOnly - today).Days;

        var dateStr = dueDate.ToString("yyyy/MM/dd");

        return daysRemaining switch
        {
            < 0 => $"{dateStr}（{Math.Abs(daysRemaining)}日超過）",
            0 => $"{dateStr}（本日）",
            1 => $"{dateStr}（明日）",
            _ => $"{dateStr}（残り{daysRemaining}日）"
        };
    }
}