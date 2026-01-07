using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Focus;
using Pecus.Libs.Focus.Models;

namespace Pecus.Libs.AI.Tools.Implementations;

/// <summary>
/// ユーザーのタスク情報を取得するツール
/// </summary>
public class GetUserTasksTool : IAiTool
{
    private readonly IFocusTaskProvider _focusTaskProvider;

    /// <inheritdoc />
    public string Name => "get_user_tasks";

    /// <inheritdoc />
    public string Description => "ユーザーの現在のタスク一覧（やることリスト）を取得します。ユーザーが「次に何をすればいい？」「何から始めればいい？」などと尋ねた時に使用します。";

    /// <inheritdoc />
    public int BasePriority => 100;

    /// <summary>
    /// GetUserTasksTool のコンストラクタ
    /// </summary>
    /// <param name="focusTaskProvider">タスク取得プロバイダー</param>
    public GetUserTasksTool(IFocusTaskProvider focusTaskProvider)
    {
        _focusTaskProvider = focusTaskProvider;
    }

    /// <inheritdoc />
    public AiToolDefinition GetDefinition() => new()
    {
        Name = Name,
        Description = Description,
        Parameters = new AiToolParameters
        {
            Properties =
            [
                new AiToolParameter
                {
                    Name = "limit",
                    Type = "integer",
                    Description = "取得するタスクの最大数（デフォルト: 5）"
                }
            ],
            Required = []
        }
    };

    /// <inheritdoc />
    public int CalculateRelevanceScore(AiToolContext context)
    {
        if (context.SentimentResult == null)
        {
            return 0;
        }

        return context.SentimentResult.GuidanceSeekingScore;
    }

    /// <inheritdoc />
    public async Task<AiToolResult> ExecuteAsync(
        AiToolContext context,
        CancellationToken cancellationToken = default)
    {
        var limit = 5;
        if (context.FunctionArguments?.TryGetValue("limit", out var limitObj) == true
            && limitObj is int limitValue)
        {
            limit = limitValue;
        }

        var taskResult = await _focusTaskProvider.GetFocusTasksAsync(
            context.UserId,
            focusTasksLimit: limit,
            waitingTasksLimit: 3,
            cancellationToken: cancellationToken
        );

        var prompt = BuildTaskContextPrompt(taskResult);

        return new AiToolResult
        {
            Success = true,
            ToolName = Name,
            ContextPrompt = prompt,
            SuggestedRole = RoleRandomizer.SecretaryRole,
            DebugInfo = $"Found {taskResult.TotalTaskCount} tasks"
        };
    }

    /// <summary>
    /// タスク情報からコンテキストプロンプトを生成する
    /// </summary>
    private static string BuildTaskContextPrompt(FocusTaskResult taskResult)
    {
        if (taskResult.TotalTaskCount == 0)
        {
            return "【参考情報】このユーザーには現在割り当てられているタスクがありません。";
        }

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("【参考情報】ユーザーのやることリスト（優先度順）:");

        if (taskResult.FocusTasks.Count > 0)
        {
            sb.AppendLine("■ 今すぐ着手可能なタスク:");
            foreach (var task in taskResult.FocusTasks)
            {
                var priorityText = task.Priority?.ToString() ?? "未設定";
                var dueText = FormatDueDate(task.DueDate);
                sb.AppendLine($"  - コード:[{task.WorkspaceCode}#{task.ItemCode}T{task.Sequence}] {task.Content} (優先度: {priorityText}, 期限: {dueText}, スコア: {task.TotalScore:F0})");
                if (!string.IsNullOrEmpty(task.ItemSubject))
                {
                    sb.AppendLine($"    関連アイテム: {task.ItemSubject}");
                }
            }
        }

        if (taskResult.WaitingTasks.Count > 0)
        {
            sb.AppendLine("■ 待機中のタスク（先行タスク完了待ち）:");
            foreach (var task in taskResult.WaitingTasks)
            {
                sb.AppendLine($"  - コード:[{task.WorkspaceCode}#{task.ItemCode}T{task.Sequence}] {task.Content} (待機中: {task.PredecessorItemCode} の完了待ち)");
            }
        }

        sb.AppendLine();
        sb.AppendLine("この情報を参考に、ユーザーが次に何をすべきか具体的にアドバイスしてください。");
        sb.AppendLine("ただし、タスク一覧をそのまま列挙するのではなく、自然な会話として提案してください。");
        sb.AppendLine("タスク名には[コード]を含めてください。");

        return sb.ToString();
    }

    /// <summary>
    /// 期限日時を人間が読みやすい形式にフォーマットする
    /// </summary>
    private static string FormatDueDate(DateTimeOffset dueDate)
    {
        var now = DateTimeOffset.UtcNow;
        var diff = dueDate - now;

        if (diff.TotalHours < 0)
        {
            return "期限切れ";
        }
        if (diff.TotalHours <= 24)
        {
            return "今日中";
        }
        if (diff.TotalHours <= 48)
        {
            return "明日";
        }
        if (diff.TotalDays <= 7)
        {
            return $"{diff.TotalDays:F0}日後";
        }

        return dueDate.ToString("M/d");
    }
}
