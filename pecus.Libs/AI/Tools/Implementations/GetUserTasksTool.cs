using Pecus.Libs.AI.Models;
using Pecus.Libs.Focus;
using Pecus.Libs.Focus.Models;

namespace Pecus.Libs.AI.Tools.Implementations;

/// <summary>
/// ユーザーのタスク情報を取得するツール
/// 感情分析の OthersFocusScore に応じて、自分のタスクかチームのタスクかを切り替える
/// </summary>
public class GetUserTasksTool : IAiTool
{
    private readonly IFocusTaskProvider _focusTaskProvider;

    /// <inheritdoc />
    public string Name => "get_user_tasks";

    /// <inheritdoc />
    public string Description => "ユーザーまたはチームのタスク一覧を取得します。「次に何をすればいい？」「何から始めればいい？」は自分のタスク、「手伝えそうなタスクは？」はチームのタスクを取得します。";

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
                },
                new AiToolParameter
                {
                    Name = "target",
                    Type = "string",
                    Description = "対象: 'self'（自分のタスク）または 'team'（チームのタスク）。デフォルトは感情分析から自動判定"
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

        // 対象を判定: Function Calling の引数 > 感情分析結果
        var isTeamFocus = DetermineIsTeamFocus(context);

        FocusTaskResult taskResult;
        string prompt;

        if (isTeamFocus)
        {
            // チームのタスク（手伝えそうなもの）を取得
            taskResult = await _focusTaskProvider.GetTeamTasksNeedingHelpAsync(
                context.UserId,
                limit: limit,
                cancellationToken: cancellationToken
            );
            prompt = BuildTeamTaskContextPrompt(taskResult);
        }
        else
        {
            // 自分のタスクを取得
            taskResult = await _focusTaskProvider.GetFocusTasksAsync(
                context.UserId,
                focusTasksLimit: limit,
                waitingTasksLimit: 3,
                cancellationToken: cancellationToken
            );
            prompt = BuildMyTaskContextPrompt(taskResult);
        }

        return new AiToolResult
        {
            Success = true,
            ToolName = Name,
            ContextPrompt = prompt,
            SuggestedRole = RoleRandomizer.SecretaryRole,
            DebugInfo = $"Found {taskResult.TotalTaskCount} tasks (isTeamFocus={isTeamFocus})"
        };
    }

    /// <summary>
    /// チームタスクを対象とするかどうかを判定
    /// </summary>
    private static bool DetermineIsTeamFocus(AiToolContext context)
    {
        // Function Calling の引数で明示的に指定された場合
        if (context.FunctionArguments?.TryGetValue("target", out var targetObj) == true
            && targetObj is string target)
        {
            return target.Equals("team", StringComparison.OrdinalIgnoreCase);
        }

        // 感情分析結果から判定
        if (context.SentimentResult == null)
        {
            return false; // デフォルトは自分のタスク
        }

        // OthersFocusScore >= 50 または TargetSubject が Team の場合はチームタスク
        return context.SentimentResult.OthersFocusScore >= 50
            || context.SentimentResult.TargetSubject == TargetSubject.Team;
    }

    /// <summary>
    /// 自分のタスク情報からコンテキストプロンプトを生成する
    /// </summary>
    private static string BuildMyTaskContextPrompt(FocusTaskResult taskResult)
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
    /// チームのタスク情報からコンテキストプロンプトを生成する
    /// </summary>
    private static string BuildTeamTaskContextPrompt(FocusTaskResult taskResult)
    {
        if (taskResult.TotalTaskCount == 0)
        {
            return "【参考情報】現在、チームメンバーで手伝いが必要そうなタスクは見つかりませんでした。みんな順調に進んでいるようです。";
        }

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("【参考情報】チームメンバーの手伝えそうなタスク:");
        sb.AppendLine("（期限が近い、またはブロックされているタスク）");

        if (taskResult.FocusTasks.Count > 0)
        {
            sb.AppendLine("■ 着手可能で期限が近いタスク:");
            foreach (var task in taskResult.FocusTasks)
            {
                var dueText = FormatDueDate(task.DueDate);
                var assignee = !string.IsNullOrEmpty(task.AssignedUserName) ? task.AssignedUserName : "未割当";
                sb.AppendLine($"  - コード:[{task.WorkspaceCode}#{task.ItemCode}T{task.Sequence}] {task.Content}");
                sb.AppendLine($"    担当: {assignee}, 期限: {dueText}");
            }
        }

        if (taskResult.WaitingTasks.Count > 0)
        {
            sb.AppendLine("■ ブロック中のタスク（先行タスク完了待ち）:");
            foreach (var task in taskResult.WaitingTasks)
            {
                var assignee = !string.IsNullOrEmpty(task.AssignedUserName) ? task.AssignedUserName : "未割当";
                sb.AppendLine($"  - コード:[{task.WorkspaceCode}#{task.ItemCode}T{task.Sequence}] {task.Content}");
                sb.AppendLine($"    担当: {assignee}, 待機中: {task.PredecessorItemCode} の完了待ち");
            }
        }

        sb.AppendLine();
        sb.AppendLine("この情報を参考に、ユーザーがどのタスクを手伝えそうか提案してください。");
        sb.AppendLine("担当者に声をかける、一緒に作業する、などの具体的なアクションを提案してください。");
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