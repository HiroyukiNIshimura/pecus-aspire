using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスク更新時にワークスペースグループチャットへメッセージを通知する Hangfire タスク
/// 必要に応じてメッセージを作成し、関連するワークスペースのグループチャットに通知する
/// </summary>
public class UpdateTaskTask : TaskNotificationTaskBase
{
    /// <summary>
    /// AI メッセージ生成用のシステムプロンプト
    /// </summary>
    private const string MessageGenerationPrompt = """
        あなたはチームのチャットルームに投稿するアシスタントです。
        【重要】これは既存タスクの「更新」通知です。新規作成ではありません。
        更新後のタスク内容を確認し、チームメンバーに対して簡潔に紹介するメッセージを生成してください。

        要件:
        - 100文字以内で簡潔にまとめる
        - 「更新」「変更」などの表現を使う（「作成」「新規」は使わない）
        - タスクの現在の状態（種類、優先度、期限、進捗など）を伝える
        - 絵文字は使わない
        - Markdownは使用しない
        - 挨拶は不要

        例: 「バグ修正タスクの優先度が高に更新されました。期限は12/25（残り3日）、進捗50%です。」
        """;

    private readonly IAiClientFactory? _aiClientFactory;
    private readonly IBotSelector? _botSelector;

    /// <summary>
    /// UpdateTaskTask のコンストラクタ
    /// </summary>
    public UpdateTaskTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        ILogger<UpdateTaskTask> logger,
        IAiClientFactory? aiClientFactory = null,
        IBotSelector? botSelector = null)
        : base(context, publisher, logger)
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
    protected override async Task<string> BuildNotificationMessageAsync(
        int organizationId,
        WorkspaceTask task,
        string userName,
        string workspaceCode)
    {
        var defaultMessage = BuildDefaultMessage(userName, workspaceCode, task.WorkspaceItem.Code, task.Sequence);

        if (_aiClientFactory == null || _botSelector == null)
        {
            Logger.LogDebug("AiClientFactory or BotSelector is not available, using default message");
            return defaultMessage;
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
                return defaultMessage;
            }

            var aiClient = _aiClientFactory.CreateClient(
                setting.GenerativeApiVendor,
                setting.GenerativeApiKey,
                setting.GenerativeApiModel
            );

            if (aiClient == null)
            {
                Logger.LogDebug("Failed to create AI client, using default message");
                return defaultMessage;
            }

            var taskTypeName = task.TaskType?.Name ?? "タスク";
            var priorityText = GetPriorityText(task.Priority);
            var dueDateText = GetDueDateText(task.DueDate);

            var contentForAnalysis = $"""
                タスク種類: {taskTypeName}
                優先度: {priorityText}
                期限: {dueDateText}
                進捗率: {task.ProgressPercentage}%
                完了: {(task.IsCompleted ? "はい" : "いいえ")}
                破棄: {(task.IsDiscarded ? "はい" : "いいえ")}
                内容: {task.Content}
                """;

            var bot = await _botSelector.SelectBotByContentAsync(
                organizationId,
                aiClient,
                contentForAnalysis
            );

            if (bot == null)
            {
                Logger.LogDebug("Bot not found, using default message");
                return defaultMessage;
            }

            // Bot のペルソナと行動指針を MessageGenerationPrompt と統合
            var botPersonaPrompt = new SystemPromptBuilder()
                .WithRawPersona(bot.Persona)
                .WithRawConstraint(bot.Constraint)
                .Build();
            var fullSystemPrompt = $"{MessageGenerationPrompt}\n\n{botPersonaPrompt}";

            var userPrompt = $"以下の更新されたタスクについて紹介メッセージを生成してください:\n\n{contentForAnalysis}";
            var generatedMessage = await aiClient.GenerateTextWithMessagesAsync(
                [
                    (MessageRole.System, $@"Userの一人称は「{userName}」さんです。"),
                    (MessageRole.User, userPrompt)
                ],
                fullSystemPrompt
            );

            if (string.IsNullOrWhiteSpace(generatedMessage))
            {
                Logger.LogDebug("AI generated empty message, using default message");
                return defaultMessage;
            }

            if (generatedMessage.Length > 100)
            {
                generatedMessage = generatedMessage[..97] + "...";
            }

            return $"{defaultMessage}\n\n{generatedMessage}";
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Failed to generate AI message for task update, using default message");
            return defaultMessage;
        }
    }

    /// <summary>
    /// タスク更新時のメッセージ通知を実行する
    /// </summary>
    /// <param name="taskId">更新されたタスクのID</param>
    public async Task NotifyTaskUpdatedAsync(int taskId)
    {
        await ExecuteNotificationAsync(taskId);
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

    /// <summary>
    /// 組織設定を取得する
    /// </summary>
    private async Task<OrganizationSetting?> GetOrganizationSettingAsync(int organizationId)
    {
        return await Context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);
    }
}