using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Focus;
using Pecus.Libs.Focus.Models;
using Pecus.Models.Responses.Focus;
using Pecus.Models.Responses.WorkspaceTask;

namespace Pecus.Services;

/// <summary>
/// やることピックアップサービス
/// タスクのスコアリングと推奨タスクの選定を行います
/// </summary>
public class FocusRecommendationService
{
    private readonly ApplicationDbContext _context;
    private readonly IFocusTaskProvider _focusTaskProvider;
    private readonly ILogger<FocusRecommendationService> _logger;

    public FocusRecommendationService(
        ApplicationDbContext context,
        IFocusTaskProvider focusTaskProvider,
        ILogger<FocusRecommendationService> logger
    )
    {
        _context = context;
        _focusTaskProvider = focusTaskProvider;
        _logger = logger;
    }

    /// <summary>
    /// ユーザーのやることピックアップタスクを取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>やることピックアップレスポンス</returns>
    public async Task<FocusRecommendationResponse> GetFocusRecommendationAsync(int userId)
    {
        _logger.LogDebug("やることピックアップタスク取得開始: UserId={UserId}", userId);

        // ユーザー設定を取得（デフォルト値使用）
        var userSetting = await _context.UserSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        var focusScorePriority = userSetting?.FocusScorePriority ?? FocusScorePriority.Deadline;
        var focusTasksLimit = userSetting?.FocusTasksLimit ?? 5;
        var waitingTasksLimit = userSetting?.WaitingTasksLimit ?? 5;

        // FocusTaskProviderを使用してタスクを取得
        var result = await _focusTaskProvider.GetFocusTasksDetailAsync(
            userId,
            focusTasksLimit,
            waitingTasksLimit,
            focusScorePriority
        );

        if (result.TotalTaskCount == 0)
        {
            return new FocusRecommendationResponse
            {
                FocusTasks = [],
                WaitingTasks = [],
                TotalTaskCount = 0,
                GeneratedAt = DateTimeOffset.UtcNow
            };
        }

        // レスポンスにマッピング
        var focusTasks = result.FocusTasks
            .Select(MapToFocusTaskResponse)
            .ToList();

        var waitingTasks = result.WaitingTasks
            .Select(MapToFocusTaskResponse)
            .ToList();

        _logger.LogDebug(
            "やることピックアップタスク取得完了: FocusTasks={FocusCount}, WaitingTasks={WaitingCount}",
            focusTasks.Count,
            waitingTasks.Count
        );

        return new FocusRecommendationResponse
        {
            FocusTasks = focusTasks,
            WaitingTasks = waitingTasks,
            TotalTaskCount = result.TotalTaskCount,
            GeneratedAt = DateTimeOffset.UtcNow
        };
    }

    /// <summary>
    /// FocusTaskDetailInfoをFocusTaskResponseにマッピング
    /// </summary>
    private static FocusTaskResponse MapToFocusTaskResponse(FocusTaskDetailInfo info)
    {
        var task = info.Task;

        return new FocusTaskResponse
        {
            Id = task.Id,
            Sequence = task.Sequence,
            WorkspaceItemId = task.WorkspaceItemId,
            WorkspaceId = task.WorkspaceId,
            WorkspaceCode = task.WorkspaceItem.Workspace?.Code,
            WorkspaceName = task.WorkspaceItem.Workspace?.Name,
            ItemCode = task.WorkspaceItem.Code,
            Content = task.Content,
            ItemSubject = task.WorkspaceItem.Subject,
            TaskTypeId = task.TaskTypeId,
            TaskTypeCode = task.TaskType?.Code,
            TaskTypeName = task.TaskType?.Name,
            TaskTypeIcon = task.TaskType?.Icon,
            Priority = task.Priority,
            DueDate = task.DueDate,
            EstimatedHours = task.EstimatedHours,
            ProgressPercentage = task.ProgressPercentage,
            TotalScore = info.TotalScore,
            SuccessorCount = info.SuccessorCount,
            SuccessorTask = info.FirstSuccessor != null
                ? new SuccessorTaskInfo
                {
                    Id = info.FirstSuccessor.Id,
                    WorkspaceItemCode = info.FirstSuccessor.WorkspaceItem.Code,
                    Content = info.FirstSuccessor.Content
                }
                : null,
            PredecessorTask = task.PredecessorTask != null
                ? new PredecessorTaskInfo
                {
                    Id = task.PredecessorTask.Id,
                    Sequence = task.PredecessorTask.Sequence,
                    WorkspaceItemCode = task.PredecessorTask.WorkspaceItem.Code,
                    Content = task.PredecessorTask.Content,
                    IsCompleted = task.PredecessorTask.IsCompleted
                }
                : null,
            ScoreDetail = new TaskScoreDetail
            {
                PriorityScore = info.ScoreDetail.PriorityScore,
                DeadlineScore = info.ScoreDetail.DeadlineScore,
                SuccessorImpactScore = info.ScoreDetail.SuccessorImpactScore,
                PriorityWeight = info.ScoreDetail.PriorityWeight,
                DeadlineWeight = info.ScoreDetail.DeadlineWeight,
                SuccessorImpactWeight = info.ScoreDetail.SuccessorImpactWeight,
                Explanation = info.ScoreDetail.Explanation
            }
        };
    }
}