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
    /// 変更情報をリクエストと前回の状態から生成する
    /// </summary>
    /// <param name="requestPriority">リクエストの優先度</param>
    /// <param name="requestStartDate">リクエストの開始日</param>
    /// <param name="requestDueDate">リクエストの期限日</param>
    /// <param name="requestEstimatedHours">リクエストの予定工数</param>
    /// <param name="requestProgressPercentage">リクエストの進捗率</param>
    /// <param name="requestAssignedUserId">リクエストの担当者ID</param>
    /// <param name="requestIsDiscarded">リクエストの破棄状態</param>
    /// <param name="requestIsCompleted">リクエストの完了状態</param>
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
        TaskPriority? requestPriority,
        DateTimeOffset? requestStartDate,
        DateTimeOffset requestDueDate,
        decimal? requestEstimatedHours,
        int? requestProgressPercentage,
        int? requestAssignedUserId,
        bool requestIsDiscarded,
        bool requestIsCompleted,
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
            PriorityChanged: requestPriority != previousPriority,
            PreviousPriority: previousPriority,
            NewPriority: requestPriority,
            StartDateChanged: requestStartDate != previousStartDate,
            PreviousStartDate: previousStartDate,
            NewStartDate: requestStartDate,
            DueDateChanged: requestDueDate != previousDueDate,
            PreviousDueDate: previousDueDate,
            NewDueDate: requestDueDate,
            EstimatedHoursChanged: requestEstimatedHours != previousEstimatedHours,
            PreviousEstimatedHours: previousEstimatedHours,
            NewEstimatedHours: requestEstimatedHours,
            ProgressPercentageChanged: requestProgressPercentage != previousProgressPercentage,
            PreviousProgressPercentage: previousProgressPercentage,
            NewProgressPercentage: requestProgressPercentage,
            AssignedUserIdChanged: requestAssignedUserId != previousAssignedUserId,
            PreviousAssignedUserId: previousAssignedUserId,
            NewAssignedUserId: requestAssignedUserId,
            IsDiscardedChanged: requestIsDiscarded != previousIsDiscarded,
            PreviousIsDiscarded: previousIsDiscarded,
            NewIsDiscarded: requestIsDiscarded,
            IsCompletedChanged: requestIsCompleted != previousIsCompleted,
            PreviousIsCompleted: previousIsCompleted,
            NewIsCompleted: requestIsCompleted
        );
    }
}
