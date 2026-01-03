using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Focus;

/// <summary>
/// タスクスコア計算ロジック（純粋な計算のみ）
/// </summary>
public static class TaskScoreCalculator
{
    /// <summary>
    /// 優先度スコアを計算
    /// </summary>
    /// <param name="priority">優先度（NULLの場合はLowとして扱う）</param>
    /// <returns>優先度スコア（1-4）</returns>
    public static decimal CalculatePriorityScore(TaskPriority? priority)
    {
        return priority switch
        {
            TaskPriority.Critical => 4m,
            TaskPriority.High => 3m,
            TaskPriority.Medium => 2m,
            TaskPriority.Low => 1m,
            null => 1m,
            _ => 1m
        };
    }

    /// <summary>
    /// 期限スコアを計算
    /// </summary>
    /// <param name="dueDate">期限日時</param>
    /// <returns>期限スコア（1-10、期限が近いほど高い）</returns>
    public static decimal CalculateDeadlineScore(DateTimeOffset dueDate)
    {
        var now = DateTimeOffset.UtcNow;
        var timeUntilDue = dueDate - now;

        // 期限切れ
        if (timeUntilDue.TotalHours < 0)
        {
            return 10m;
        }

        // 今日中（24時間以内）
        if (timeUntilDue.TotalHours <= 24)
        {
            return 8m;
        }

        // 明日（48時間以内）
        if (timeUntilDue.TotalHours <= 48)
        {
            return 6m;
        }

        // 2-3日後（72時間以内）
        if (timeUntilDue.TotalHours <= 72)
        {
            return 4m;
        }

        // 今週中（7日以内）
        if (timeUntilDue.TotalDays <= 7)
        {
            return 3m;
        }

        // 来週（14日以内）
        if (timeUntilDue.TotalDays <= 14)
        {
            return 2m;
        }

        // それ以降
        return 1m;
    }

    /// <summary>
    /// 後続タスク影響スコアを計算
    /// </summary>
    /// <param name="successorCount">後続タスク数</param>
    /// <returns>影響スコア（0-10）</returns>
    public static decimal CalculateSuccessorImpactScore(int successorCount)
    {
        return successorCount switch
        {
            >= 3 => 10m,
            2 => 6m,
            1 => 3m,
            _ => 0m
        };
    }

    /// <summary>
    /// 総合スコアを計算
    /// </summary>
    /// <param name="priority">優先度</param>
    /// <param name="dueDate">期限日時</param>
    /// <param name="successorCount">後続タスク数</param>
    /// <param name="priorityWeight">優先度の重み</param>
    /// <param name="deadlineWeight">期限の重み</param>
    /// <param name="successorImpactWeight">後続タスク影響の重み</param>
    /// <returns>総合スコア</returns>
    public static decimal CalculateTotalScore(
        TaskPriority? priority,
        DateTimeOffset dueDate,
        int successorCount,
        decimal priorityWeight = 2m,
        decimal deadlineWeight = 3m,
        decimal successorImpactWeight = 5m)
    {
        var priorityScore = CalculatePriorityScore(priority);
        var deadlineScore = CalculateDeadlineScore(dueDate);
        var successorImpactScore = CalculateSuccessorImpactScore(successorCount);

        return (priorityScore * priorityWeight)
             + (deadlineScore * deadlineWeight)
             + (successorImpactScore * successorImpactWeight);
    }

    /// <summary>
    /// FocusScorePriorityに応じた重みを取得
    /// </summary>
    /// <param name="focusScorePriority">優先要素</param>
    /// <returns>(priorityWeight, deadlineWeight, successorImpactWeight)</returns>
    public static (decimal PriorityWeight, decimal DeadlineWeight, decimal SuccessorImpactWeight) GetWeights(
        FocusScorePriority focusScorePriority)
    {
        return focusScorePriority switch
        {
            FocusScorePriority.Priority => (4m, 3m, 5m),
            FocusScorePriority.Deadline => (2m, 5m, 5m),
            FocusScorePriority.SuccessorImpact => (2m, 3m, 7m),
            _ => (2m, 3m, 5m)
        };
    }
}