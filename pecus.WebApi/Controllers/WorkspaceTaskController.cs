using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Hangfire.Tasks.Bot;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// ワークスペースタスクコントローラー
/// ワークスペースアイテムに紐づくタスクの管理を行います
/// </summary>
[Route("api/workspaces/{workspaceId}/items/{itemId}/tasks")]
[Produces("application/json")]
[Tags("WorkspaceTask")]
public class WorkspaceTaskController : BaseSecureController
{
    private readonly WorkspaceTaskService _workspaceTaskService;
    private readonly TaskContentSuggestionService _taskContentSuggestionService;
    private readonly TaskGenerationService _taskGenerationService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly AchievementService _achievementService;
    private readonly ILogger<WorkspaceTaskController> _logger;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly FrontendUrlResolver _frontendUrlResolver;

    public WorkspaceTaskController(
        WorkspaceTaskService workspaceTaskService,
        TaskContentSuggestionService taskContentSuggestionService,
        TaskGenerationService taskGenerationService,
        OrganizationAccessHelper accessHelper,
        AchievementService achievementService,
        ProfileService profileService,
        ILogger<WorkspaceTaskController> logger,
        IBackgroundJobClient backgroundJobClient,
        FrontendUrlResolver frontendUrlResolver
    ) : base(profileService, logger)
    {
        _workspaceTaskService = workspaceTaskService;
        _taskContentSuggestionService = taskContentSuggestionService;
        _taskGenerationService = taskGenerationService;
        _accessHelper = accessHelper;
        _achievementService = achievementService;
        _logger = logger;
        _backgroundJobClient = backgroundJobClient;
        _frontendUrlResolver = frontendUrlResolver;
    }

    /// <summary>
    /// タスク作成
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">作成リクエスト</param>
    /// <returns>作成されたタスク</returns>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceTaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceTaskResponse>> CreateWorkspaceTask(
        int workspaceId,
        int itemId,
        [FromBody] CreateWorkspaceTaskRequest request
    )
    {
        // ワークスペースへのアクセス権限と編集権限をチェック（Viewerは403）
        await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);

        var task = await _workspaceTaskService.CreateWorkspaceTaskAsync(
            workspaceId,
            itemId,
            request,
            CurrentUserId
        );

        // タスク作成通知メールを送信
        await SendTaskCreatedEmailAsync(task.Id);

        // ワークスペースタスク作成通知をバックグラウンドジョブで実行
        _backgroundJobClient.Enqueue<CreateTaskTask>(x =>
                       x.NotifyTaskCreatedAsync(
                          task.Id
                       )
                   );

        var response = new WorkspaceTaskResponse
        {
            Success = true,
            Message = "タスクを作成しました。",
            WorkspaceTask = BuildTaskDetailResponse(task),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// タスク取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <returns>タスク詳細</returns>
    [HttpGet("{taskId}")]
    [ProducesResponseType(typeof(WorkspaceTaskDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceTaskDetailResponse>> GetWorkspaceTask(
        int workspaceId,
        int itemId,
        int taskId
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var (task, commentCount, commentTypeCounts) = await _workspaceTaskService.GetWorkspaceTaskAsync(
            workspaceId,
            itemId,
            taskId
        );

        return TypedResults.Ok(BuildTaskDetailResponse(task, commentCount: commentCount, commentTypeCounts: commentTypeCounts));
    }

    /// <summary>
    /// シーケンス番号でタスク取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="sequence">タスクシーケンス番号（アイテム内で一意）</param>
    /// <returns>タスク詳細</returns>
    [HttpGet("sequence/{sequence}")]
    [ProducesResponseType(typeof(WorkspaceTaskDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceTaskDetailResponse>> GetWorkspaceTaskBySequence(
        int workspaceId,
        int itemId,
        int sequence
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var (task, commentCount, commentTypeCounts) = await _workspaceTaskService.GetWorkspaceTaskBySequenceAsync(
            workspaceId,
            itemId,
            sequence
        );

        return TypedResults.Ok(BuildTaskDetailResponse(task, commentCount: commentCount, commentTypeCounts: commentTypeCounts));
    }

    /// <summary>
    /// アイテムのタスク一覧取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">フィルタリング・ページネーションリクエスト</param>
    /// <returns>タスク一覧（統計情報付き）</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<WorkspaceTaskDetailResponse, WorkspaceTaskStatistics>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceTaskDetailResponse, WorkspaceTaskStatistics>>> GetWorkspaceTasks(
        int workspaceId,
        int itemId,
        [FromQuery] GetWorkspaceTasksRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var (tasks, commentCounts, commentTypeCounts, totalCount) = await _workspaceTaskService.GetWorkspaceTasksAsync(
            workspaceId,
            itemId,
            request
        );

        // 統計情報を取得
        var statistics = await _workspaceTaskService.GetWorkspaceTaskStatisticsAsync(
            workspaceId,
            itemId
        );

        var pageSize = request.PageSize;
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        // ページネーション用のオフセット計算（無限スクロール対応）
        var offset = (request.Page - 1) * pageSize;

        var response = new PagedResponse<WorkspaceTaskDetailResponse, WorkspaceTaskStatistics>
        {
            Data = tasks.Select((t, index) => BuildTaskDetailResponse(
                t,
                listIndex: offset + index,
                commentCount: commentCounts.GetValueOrDefault(t.Id, 0),
                commentTypeCounts: commentTypeCounts.GetValueOrDefault(t.Id, new Dictionary<TaskCommentType, int>())
            )),
            CurrentPage = request.Page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPreviousPage = request.Page > 1,
            HasNextPage = request.Page < totalPages,
            Summary = statistics,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// タスクフローマップ取得
    /// アイテム内のタスク依存関係を可視化するためのデータを取得します
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <returns>タスクフローマップ</returns>
    [HttpGet("flow-map")]
    [ProducesResponseType(typeof(TaskFlowMapResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TaskFlowMapResponse>> GetTaskFlowMap(
        int workspaceId,
        int itemId
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var response = await _workspaceTaskService.GetTaskFlowMapAsync(workspaceId, itemId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 担当者のタスク負荷を期限日ごとにチェック
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">チェックリクエスト</param>
    /// <returns>担当者の期限日別タスク負荷</returns>
    [HttpGet("assignee-load-check")]
    [ProducesResponseType(typeof(AssigneeTaskLoadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AssigneeTaskLoadResponse>> CheckAssigneeTaskLoad(
        int workspaceId,
        int itemId,
        [FromQuery] CheckAssigneeTaskLoadRequest request
    )
    {
        // ワークスペースへのアクセス権限と編集権限をチェック（Viewerは403）
        await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);

        var response = await _workspaceTaskService.CheckAssigneeTaskLoadAsync(
            workspaceId,
            itemId,
            request
        );

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// タスク更新
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="request">更新リクエスト</param>
    /// <returns>更新されたタスク</returns>
    [HttpPut("{taskId}")]
    [ProducesResponseType(typeof(WorkspaceTaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceTaskDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceTaskResponse>> UpdateWorkspaceTask(
        int workspaceId,
        int itemId,
        int taskId,
        [FromBody] UpdateWorkspaceTaskRequest request
    )
    {
        // ワークスペースへのアクセス権限と編集権限をチェック（Viewerは403）
        await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);

        var (task, previousTask, commentCount, commentTypeCounts) = await _workspaceTaskService.UpdateWorkspaceTaskAsync(
            workspaceId,
            itemId,
            taskId,
            request,
            CurrentUserId
        );

        if (previousTask != null)
        {
            // タスク完了または破棄時にメール送信
            if ((previousTask.IsCompleted != task.IsCompleted) || (previousTask.IsDiscarded != task.IsDiscarded))
            {
                await SendTaskCompletedEmailAsync(task.Id, request.IsDiscarded == true);
            }

            // ワークスペースタスク更新通知をバックグラウンドジョブで実行
            if (previousTask.IsCompleted != task.IsCompleted && task.IsCompleted)
            {
                _backgroundJobClient.Enqueue<CompleteTaskTask>(x =>
                    x.NotifyTaskCompletedAsync(task.Id)
                );
            }

            var changes = TaskUpdateChanges.FromComparison(
                currentPriority: task.Priority,
                currentStartDate: task.StartDate,
                currentDueDate: task.DueDate,
                currentEstimatedHours: task.EstimatedHours,
                currentProgressPercentage: task.ProgressPercentage,
                currentAssignedUserId: task.AssignedUserId,
                currentIsDiscarded: task.IsDiscarded,
                currentIsCompleted: task.IsCompleted,
                previousPriority: previousTask.Priority,
                previousStartDate: previousTask.StartDate,
                previousDueDate: previousTask.DueDate,
                previousEstimatedHours: previousTask.EstimatedHours,
                previousProgressPercentage: previousTask.ProgressPercentage,
                previousAssignedUserId: previousTask.Assigned.Id,
                previousIsDiscarded: previousTask.IsDiscarded,
                previousIsCompleted: previousTask.IsCompleted
            );

            if (changes.HasAnyChanges)
            {
                _backgroundJobClient.Enqueue<UpdateTaskTask>(x =>
                    x.NotifyTaskUpdatedAsync(task.Id, CurrentUserId, changes)
                );
            }
        }

        // タスク完了時は未通知バッジを取得
        var newAchievements = (previousTask != null && previousTask.IsCompleted != task.IsCompleted && task.IsCompleted)
            ? await _achievementService.GetUnnotifiedAchievementsAsync(CurrentUserId)
            : null;

        var response = new WorkspaceTaskResponse
        {
            Success = true,
            Message = "タスクを更新しました。",
            WorkspaceTask = BuildTaskDetailResponse(task, commentCount: commentCount, commentTypeCounts: commentTypeCounts),
            PreviousWorkspaceTask = previousTask,
            NewAchievements = newAchievements,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// タスク作成時に関係者へメール送信
    /// </summary>
    private async Task SendTaskCreatedEmailAsync(int taskId)
    {
        // タスク情報を取得
        var taskInfo = await _workspaceTaskService.GetTaskWithDetailsForEmailAsync(taskId);
        if (taskInfo == null)
        {
            _logger.LogWarning(
                "タスク作成メール送信: タスク情報が取得できませんでした。TaskId={TaskId}",
                taskId
            );
            return;
        }

        // 通知先ユーザー一覧を取得（タスク担当者、アイテム担当者、コミッタ、オーナー）
        var targetUsers = await _workspaceTaskService.GetTaskCreationNotificationTargetsAsync(
            taskId,
            CurrentUserId // タスク作成者は除外
        );

        if (targetUsers.Count == 0)
        {
            _logger.LogInformation(
                "タスク作成メール送信: 通知先ユーザーがいません。TaskId={TaskId}",
                taskId
            );
            return;
        }

        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
        var taskUrl = $"{baseUrl}/workspaces/{taskInfo.Workspace?.Code}?itemCode={taskInfo.WorkspaceItem?.Code}&task={taskInfo.Sequence}";

        // 各ユーザーにメール送信ジョブを登録
        foreach (var user in targetUsers)
        {
            if (string.IsNullOrEmpty(user.Email))
            {
                continue;
            }

            var emailModel = new TaskCreatedEmailModel
            {
                UserName = user.Username,
                TaskTitle = taskInfo.Content,
                TaskCode = $"{taskInfo.WorkspaceItem?.Code}-{taskInfo.Sequence}",
                Priority = taskInfo.Priority?.ToString(),
                DueDate = taskInfo.DueDate,
                AssigneeName = taskInfo.AssignedUser?.Username,
                CreatedByName = CurrentUser?.Username ?? "",
                CreatedAt = taskInfo.CreatedAt,
                WorkspaceName = taskInfo.Workspace?.Name ?? "",
                WorkspaceCode = taskInfo.Workspace?.Code ?? "",
                TaskUrl = taskUrl,
            };

            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    CurrentOrganizationId,
                    user.Email,
                    "新しいタスクが作成されました",
                    emailModel
                )
            );
        }

        _logger.LogInformation(
            "タスク作成メールをキューに追加しました。TaskId={TaskId}, TargetCount={Count}",
            taskId,
            targetUsers.Count
        );
    }

    /// <summary>
    /// タスク完了/破棄時に関係者へメール送信
    /// </summary>
    /// <param name="taskId">タスクID</param>
    /// <param name="isDiscarded">破棄の場合true</param>
    private async Task SendTaskCompletedEmailAsync(int taskId, bool isDiscarded)
    {
        // タスク情報を取得
        var taskInfo = await _workspaceTaskService.GetTaskWithDetailsForEmailAsync(taskId);
        if (taskInfo == null)
        {
            _logger.LogWarning(
                "タスク完了メール送信: タスク情報が取得できませんでした。TaskId={TaskId}",
                taskId
            );
            return;
        }

        // 通知先ユーザー一覧を取得（アイテム担当者、コミッタ、オーナー）
        var targetUsers = await _workspaceTaskService.GetTaskCompletionNotificationTargetsAsync(
            taskId,
            CurrentUserId // 完了/破棄実行者は除外
        );

        if (targetUsers.Count == 0)
        {
            _logger.LogInformation(
                "タスク完了メール送信: 通知先ユーザーがいません。TaskId={TaskId}",
                taskId
            );
            return;
        }

        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
        var taskUrl = $"{baseUrl}/workspaces/{taskInfo.Workspace?.Code}?itemCode={taskInfo.WorkspaceItem?.Code}&task={taskInfo.Sequence}";

        var subject = isDiscarded ? "タスクが破棄されました" : "タスクが完了しました";
        var completedAt = isDiscarded ? taskInfo.DiscardedAt ?? DateTimeOffset.UtcNow : taskInfo.CompletedAt ?? DateTimeOffset.UtcNow;

        // 各ユーザーにメール送信ジョブを登録
        foreach (var user in targetUsers)
        {
            if (string.IsNullOrEmpty(user.Email))
            {
                continue;
            }

            var emailModel = new TaskCompletedEmailModel
            {
                UserName = user.Username,
                TaskTitle = taskInfo.Content,
                TaskCode = $"{taskInfo.WorkspaceItem?.Code}-{taskInfo.Sequence}",
                AssigneeName = taskInfo.AssignedUser?.Username,
                CompletedByName = CurrentUser?.Username,
                DiscardReason = isDiscarded ? taskInfo.DiscardReason : null,
                CompletedAt = completedAt,
                WorkspaceName = taskInfo.Workspace?.Name ?? "",
                WorkspaceCode = taskInfo.Workspace?.Code ?? "",
                TaskUrl = taskUrl,
            };

            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    CurrentOrganizationId,
                    user.Email,
                    subject,
                    emailModel
                )
            );
        }

        _logger.LogInformation(
            "タスク完了メールをキューに追加しました。TaskId={TaskId}, IsDiscarded={IsDiscarded}, TargetCount={Count}",
            taskId,
            isDiscarded,
            targetUsers.Count
        );
    }

    /// <summary>
    /// タスク内容提案取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">タスク内容提案リクエスト</param>
    /// <returns>提案されたタスク内容</returns>
    [HttpPost("content-suggestion")]
    [ProducesResponseType(typeof(TaskContentSuggestionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TaskContentSuggestionResponse>> GetTaskContentSuggestion(
        int workspaceId,
        int itemId,
        [FromBody] TaskContentSuggestionRequest request)
    {
        var workspace = await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);

        var workspaceContext = $"{workspace.Genre?.Name}: {workspace.Name}";

        var suggestion = await _taskContentSuggestionService.SuggestTaskContentForOrganizationAsync(
            workspace.OrganizationId,
            workspaceId,
            itemId,
            request.TaskTypeId,
            workspaceContext);

        return TypedResults.Ok(new TaskContentSuggestionResponse
        {
            SuggestedContent = suggestion ?? string.Empty
        });
    }

    /// <summary>
    /// タスク候補生成（AI）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">タスク候補生成リクエスト</param>
    /// <returns>生成されたタスク候補</returns>
    [HttpPost("generate-candidates")]
    [ProducesResponseType(typeof(TaskGenerationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TaskGenerationResponse>> GenerateTaskCandidates(
        int workspaceId,
        int itemId,
        [FromBody] GenerateTaskCandidatesRequest request)
    {
        var workspace = await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);

        var response = await _taskGenerationService.GenerateTaskCandidatesAsync(
            workspace.OrganizationId,
            workspaceId,
            itemId,
            request);

        // AI設定がない場合は空のレスポンスを返す
        if (response == null)
        {
            return TypedResults.Ok(new TaskGenerationResponse
            {
                Candidates = [],
                TotalEstimatedDays = 0,
                CriticalPathDescription = null,
                Suggestions = ["組織にAI設定がありません。管理者にお問い合わせください。"]
            });
        }

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// タスク一括作成
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">一括作成リクエスト</param>
    /// <returns>作成されたタスクの一覧</returns>
    [HttpPost("bulk-create")]
    [ProducesResponseType(typeof(BulkCreateTasksResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<BulkCreateTasksResponse>> BulkCreateTasks(
        int workspaceId,
        int itemId,
        [FromBody] BulkCreateTasksRequest request)
    {
        await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);

        var createdTasks = new List<CreatedTaskInfo>();
        var createdTaskIds = new Dictionary<int, int>(); // requestIndex -> taskId

        for (var i = 0; i < request.Tasks.Count; i++)
        {
            var taskItem = request.Tasks[i];

            // PredecessorTaskIdとPredecessorIndexの両方が指定されている場合はエラー
            if (taskItem.PredecessorTaskId.HasValue && taskItem.PredecessorIndex.HasValue)
            {
                throw new InvalidOperationException(
                    $"タスク {i + 1}: PredecessorTaskIdとPredecessorIndexは同時に指定できません。");
            }

            // 先行タスクIDの解決
            int? predecessorTaskId = null;

            if (taskItem.PredecessorTaskId.HasValue)
            {
                // 既存タスクを先行タスクとして指定
                predecessorTaskId = taskItem.PredecessorTaskId.Value;
            }
            else if (taskItem.PredecessorIndex.HasValue)
            {
                // 同一リクエスト内の参照
                if (taskItem.PredecessorIndex.Value >= i)
                {
                    throw new InvalidOperationException(
                        $"タスク {i + 1} の先行タスクインデックス {taskItem.PredecessorIndex.Value} は自身より前のタスクを指定する必要があります。");
                }

                if (!createdTaskIds.TryGetValue(taskItem.PredecessorIndex.Value, out var resolvedPredecessorId))
                {
                    throw new InvalidOperationException(
                        $"タスク {i + 1} の先行タスクインデックス {taskItem.PredecessorIndex.Value} が見つかりません。");
                }

                predecessorTaskId = resolvedPredecessorId;
            }

            // CreateWorkspaceTaskRequestに変換
            var createRequest = new CreateWorkspaceTaskRequest
            {
                Content = taskItem.Content,
                TaskTypeId = taskItem.TaskTypeId,
                AssignedUserId = taskItem.AssignedUserId,
                Priority = taskItem.Priority,
                StartDate = taskItem.StartDate.HasValue
                    ? new DateTimeOffset(taskItem.StartDate.Value.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero)
                    : null,
                DueDate = new DateTimeOffset(taskItem.DueDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero),
                EstimatedHours = taskItem.EstimatedHours,
                PredecessorTaskId = predecessorTaskId
            };

            var task = await _workspaceTaskService.CreateWorkspaceTaskAsync(
                workspaceId,
                itemId,
                createRequest,
                CurrentUserId);

            createdTaskIds[i] = task.Id;

            createdTasks.Add(new CreatedTaskInfo
            {
                RequestIndex = i,
                TaskId = task.Id,
                Sequence = task.Sequence,
                Content = task.Content
            });

            // タスク作成通知（既存のメソッドを再利用）
            await SendTaskCreatedEmailAsync(task.Id);

            // ワークスペースタスク作成通知をバックグラウンドジョブで実行
            _backgroundJobClient.Enqueue<CreateTaskTask>(x =>
                           x.NotifyTaskCreatedAsync(
                              task.Id
                           )
                       );
        }

        return TypedResults.Ok(new BulkCreateTasksResponse
        {
            CreatedTasks = createdTasks,
            TotalCreated = createdTasks.Count
        });
    }

    /// <summary>
    /// WorkspaceTaskエンティティからレスポンスを生成
    /// </summary>
    /// <param name="task">タスクエンティティ</param>
    /// <param name="listIndex">リスト内でのインデックス（Reactのkey用）</param>
    /// <param name="commentCount">コメント数</param>
    /// <param name="commentTypeCounts">コメントタイプ別件数</param>
    private static WorkspaceTaskDetailResponse BuildTaskDetailResponse(
        WorkspaceTask task,
        int listIndex = 0,
        int commentCount = 0,
        Dictionary<TaskCommentType, int>? commentTypeCounts = null
    )
    {
        return new WorkspaceTaskDetailResponse
        {
            ListIndex = listIndex,
            Id = task.Id,
            WorkspaceItemId = task.WorkspaceItemId,
            Sequence = task.Sequence,
            WorkspaceId = task.WorkspaceId,
            OrganizationId = task.OrganizationId,
            // アイテム権限情報（タスク編集権限チェック用）
            ItemOwner = UserIdentityResponseBuilder.FromUserWithId(task.WorkspaceItem?.OwnerId ?? 0, task.WorkspaceItem?.Owner),
            ItemAssignee = UserIdentityResponseBuilder.FromNullableUserWithId(task.WorkspaceItem?.AssigneeId, task.WorkspaceItem?.Assignee),
            ItemCommitter = UserIdentityResponseBuilder.FromNullableUserWithId(task.WorkspaceItem?.CommitterId, task.WorkspaceItem?.Committer),
            Assigned = UserIdentityResponseBuilder.FromUserWithId(task.AssignedUserId, task.AssignedUser),
            CompletedBy = UserIdentityResponseBuilder.FromNullableUserWithId(task.CompletedByUserId, task.CompletedByUser),
            CreatedBy = UserIdentityResponseBuilder.FromUserWithId(task.CreatedByUserId, task.CreatedByUser),
            Content = task.Content,
            TaskTypeId = task.TaskTypeId,
            TaskTypeCode = task.TaskType?.Code,
            TaskTypeName = task.TaskType?.Name,
            TaskTypeIcon = task.TaskType?.Icon,
            Priority = task.Priority,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            EstimatedHours = task.EstimatedHours,
            ActualHours = task.ActualHours,
            ProgressPercentage = task.ProgressPercentage,
            IsCompleted = task.IsCompleted,
            CompletedAt = task.CompletedAt,
            IsDiscarded = task.IsDiscarded,
            DiscardedAt = task.DiscardedAt,
            DiscardReason = task.DiscardReason,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            CommentCount = commentCount,
            CommentTypeCounts = commentTypeCounts ?? new Dictionary<TaskCommentType, int>(),
            PredecessorTaskId = task.PredecessorTaskId,
            PredecessorTask = task.PredecessorTask != null ? new PredecessorTaskInfo
            {
                Id = task.PredecessorTask.Id,
                Sequence = task.PredecessorTask.Sequence,
                Content = task.PredecessorTask.Content,
                IsCompleted = task.PredecessorTask.IsCompleted,
                WorkspaceItemCode = null  // 一覧では不要
            } : null,
            RowVersion = task.RowVersion,
        };
    }
}