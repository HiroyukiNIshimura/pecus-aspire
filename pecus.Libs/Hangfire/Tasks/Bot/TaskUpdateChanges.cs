using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスク更新時の変更情報を保持するrecord
/// </summary>
/// <param name="PriorityChanged">優先度が変更されたか</param>
/// <param name="PreviousPriority">変更前の優先度</param>
/// <param name="NewPriority">変更後の優先度</param>
/// <param name="StartDateChanged">開始日が変更されたか</param>
/// <param name="PreviousStartDate">変更前の開始日</param>
/// <param name="NewStartDate">変更後の開始日</param>
/// <param name="DueDateChanged">期限日が変更されたか</param>
/// <param name="PreviousDueDate">変更前の期限日</param>
/// <param name="NewDueDate">変更後の期限日</param>
/// <param name="EstimatedHoursChanged">予定工数が変更されたか</param>
/// <param name="PreviousEstimatedHours">変更前の予定工数</param>
/// <param name="NewEstimatedHours">変更後の予定工数</param>
/// <param name="ProgressPercentageChanged">進捗率が変更されたか</param>
/// <param name="PreviousProgressPercentage">変更前の進捗率</param>
/// <param name="NewProgressPercentage">変更後の進捗率</param>
/// <param name="AssignedUserIdChanged">担当者が変更されたか</param>
/// <param name="PreviousAssignedUserId">変更前の担当者ID</param>
/// <param name="NewAssignedUserId">変更後の担当者ID</param>
/// <param name="IsDiscardedChanged">破棄状態が変更されたか</param>
/// <param name="PreviousIsDiscarded">変更前の破棄状態</param>
/// <param name="NewIsDiscarded">変更後の破棄状態</param>
/// <param name="IsCompletedChanged">完了状態が変更されたか</param>
/// <param name="PreviousIsCompleted">変更前の完了状態</param>
/// <param name="NewIsCompleted">変更後の完了状態</param>
public record TaskUpdateChanges(
    bool PriorityChanged,
    TaskPriority? PreviousPriority,
    TaskPriority? NewPriority,
    bool StartDateChanged,
    DateTimeOffset? PreviousStartDate,
    DateTimeOffset? NewStartDate,
    bool DueDateChanged,
    DateTimeOffset PreviousDueDate,
    DateTimeOffset NewDueDate,
    bool EstimatedHoursChanged,
    decimal? PreviousEstimatedHours,
    decimal? NewEstimatedHours,
    bool ProgressPercentageChanged,
    int? PreviousProgressPercentage,
    int? NewProgressPercentage,
    bool AssignedUserIdChanged,
    int? PreviousAssignedUserId,
    int? NewAssignedUserId,
    bool IsDiscardedChanged,
    bool PreviousIsDiscarded,
    bool NewIsDiscarded,
    bool IsCompletedChanged,
    bool PreviousIsCompleted,
    bool NewIsCompleted
)
{
    /// <summary>
    /// いずれかの項目が変更されているか
    /// </summary>
    public bool HasAnyChanges =>
        PriorityChanged ||
        StartDateChanged ||
        DueDateChanged ||
        EstimatedHoursChanged ||
        ProgressPercentageChanged ||
        AssignedUserIdChanged ||
        IsDiscardedChanged ||
        IsCompletedChanged;

    /// <summary>
    /// 変更情報を現在の状態と変更前の状態から生成する
    /// </summary>
    /// <param name="currentPriority">現在（更新後）の優先度</param>
    /// <param name="currentStartDate">現在（更新後）の開始日</param>
    /// <param name="currentDueDate">現在（更新後）の期限日</param>
    /// <param name="currentEstimatedHours">現在（更新後）の予定工数</param>
    /// <param name="currentProgressPercentage">現在（更新後）の進捗率</param>
    /// <param name="currentAssignedUserId">現在（更新後）の担当者ID</param>
    /// <param name="currentIsDiscarded">現在（更新後）の破棄状態</param>
    /// <param name="currentIsCompleted">現在（更新後）の完了状態</param>
    /// <param name="previousPriority">変更前の優先度</param>
    /// <param name="previousStartDate">変更前の開始日</param>
    /// <param name="previousDueDate">変更前の期限日</param>
    /// <param name="previousEstimatedHours">変更前の予定工数</param>
    /// <param name="previousProgressPercentage">変更前の進捗率</param>
    /// <param name="previousAssignedUserId">変更前の担当者ID</param>
    /// <param name="previousIsDiscarded">変更前の破棄状態</param>
    /// <param name="previousIsCompleted">変更前の完了状態</param>
    /// <returns>変更情報</returns>
    public static TaskUpdateChanges FromComparison(
        TaskPriority? currentPriority,
        DateTimeOffset? currentStartDate,
        DateTimeOffset currentDueDate,
        decimal? currentEstimatedHours,
        int? currentProgressPercentage,
        int? currentAssignedUserId,
        bool currentIsDiscarded,
        bool currentIsCompleted,
        TaskPriority? previousPriority,
        DateTimeOffset? previousStartDate,
        DateTimeOffset previousDueDate,
        decimal? previousEstimatedHours,
        int? previousProgressPercentage,
        int? previousAssignedUserId,
        bool previousIsDiscarded,
        bool previousIsCompleted
    )
    {
        return new TaskUpdateChanges(
            PriorityChanged: currentPriority != previousPriority,
            PreviousPriority: previousPriority,
            NewPriority: currentPriority,
            StartDateChanged: currentStartDate != previousStartDate,
            PreviousStartDate: previousStartDate,
            NewStartDate: currentStartDate,
            DueDateChanged: currentDueDate != previousDueDate,
            PreviousDueDate: previousDueDate,
            NewDueDate: currentDueDate,
            EstimatedHoursChanged: currentEstimatedHours != previousEstimatedHours,
            PreviousEstimatedHours: previousEstimatedHours,
            NewEstimatedHours: currentEstimatedHours,
            ProgressPercentageChanged: currentProgressPercentage != previousProgressPercentage,
            PreviousProgressPercentage: previousProgressPercentage,
            NewProgressPercentage: currentProgressPercentage,
            AssignedUserIdChanged: currentAssignedUserId != previousAssignedUserId,
            PreviousAssignedUserId: previousAssignedUserId,
            NewAssignedUserId: currentAssignedUserId,
            IsDiscardedChanged: currentIsDiscarded != previousIsDiscarded,
            PreviousIsDiscarded: previousIsDiscarded,
            NewIsDiscarded: currentIsDiscarded,
            IsCompletedChanged: currentIsCompleted != previousIsCompleted,
            PreviousIsCompleted: previousIsCompleted,
            NewIsCompleted: currentIsCompleted
        );
    }
}
