using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Responses.External;

namespace Pecus.Services;

/// <summary>
/// 外部API経由でワークスペースタスクを操作するサービス
/// </summary>
public class ExternalWorkspaceTaskService(
    ApplicationDbContext context) : IExternalWorkspaceTaskService
{
    /// <inheritdoc />
    public async Task<ExternalWorkspaceTaskListResponse> GetTasksAsync(
        int organizationId,
        string workspaceIdOrCode,
        int itemNumber,
        bool? isCompleted = null,
        bool? isDiscarded = null,
        CancellationToken cancellationToken = default)
    {
        var (workspace, item) = await GetWorkspaceAndItemAsync(organizationId, workspaceIdOrCode, itemNumber, cancellationToken);

        var query = context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.WorkspaceItemId == item.Id);

        if (isCompleted.HasValue)
        {
            query = query.Where(t => t.IsCompleted == isCompleted.Value);
        }

        if (isDiscarded.HasValue)
        {
            query = query.Where(t => t.IsDiscarded == isDiscarded.Value);
        }

        var tasks = await query
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.TaskType)
            .OrderBy(t => t.Sequence)
            .ToListAsync(cancellationToken);

        var taskSummaries = tasks.Select(t => new ExternalTaskSummaryResponse
        {
            Sequence = t.Sequence,
            AssignedUser = new ExternalUserRefResponse
            {
                LoginId = t.AssignedUser.LoginId,
                Username = t.AssignedUser.Username,
            },
            CreatedByUser = new ExternalUserRefResponse
            {
                LoginId = t.CreatedByUser.LoginId,
                Username = t.CreatedByUser.Username,
            },
            IsCompleted = t.IsCompleted,
            CompletedAt = t.CompletedAt,
            CompletedByUser = t.CompletedByUser != null
                ? new ExternalUserRefResponse
                {
                    LoginId = t.CompletedByUser.LoginId,
                    Username = t.CompletedByUser.Username,
                }
                : null,
            Discarded = t.IsDiscarded
                ? new ExternalTaskDiscardedResponse
                {
                    DiscardedAt = t.DiscardedAt,
                    DiscardReason = t.DiscardReason,
                }
                : null,
            TaskType = new ExternalTaskTypeRefResponse
            {
                Code = t.TaskType.Code,
                Name = t.TaskType.Name,
            },
            Priority = t.Priority,
            StartDate = t.StartDate,
            DueDate = t.DueDate,
            EstimatedHours = t.EstimatedHours,
            ActualHours = t.ActualHours,
            ProgressPercentage = t.ProgressPercentage,
        }).ToList();

        return new ExternalWorkspaceTaskListResponse
        {
            Workspace = new ExternalWorkspaceRefResponse
            {
                Code = workspace.Code ?? string.Empty,
            },
            Item = new ExternalItemRefResponse
            {
                ItemNumber = item.ItemNumber,
            },
            Tasks = taskSummaries,
        };
    }

    /// <inheritdoc />
    public async Task<ExternalWorkspaceTaskDetailResponse> GetTaskAsync(
        int organizationId,
        string workspaceIdOrCode,
        int itemNumber,
        int sequence,
        CancellationToken cancellationToken = default)
    {
        var (workspace, item) = await GetWorkspaceAndItemAsync(organizationId, workspaceIdOrCode, itemNumber, cancellationToken);

        var task = await context.WorkspaceTasks
            .AsNoTracking()
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .Include(t => t.TaskType)
            .FirstOrDefaultAsync(
                t => t.WorkspaceItemId == item.Id && t.Sequence == sequence,
                cancellationToken);

        if (task == null)
        {
            throw new NotFoundException($"アイテム番号 '{itemNumber}' にタスクシーケンス番号 '{sequence}' が見つかりません。");
        }

        List<ExternalPredecessorTaskResponse> predecessorTasks = [];
        if (task.PredecessorTaskIds != null && task.PredecessorTaskIds.Length > 0)
        {
            var predecessorSequences = await context.WorkspaceTasks
                .AsNoTracking()
                .Where(t => task.PredecessorTaskIds.Contains(t.Id))
                .OrderBy(t => t.Sequence)
                .Select(t => t.Sequence)
                .ToListAsync(cancellationToken);

            predecessorTasks = predecessorSequences
                .Select(seq => new ExternalPredecessorTaskResponse { Sequence = seq })
                .ToList();
        }

        var taskDetail = new ExternalTaskDetailResponse
        {
            Sequence = task.Sequence,
            AssignedUser = new ExternalUserRefResponse
            {
                LoginId = task.AssignedUser.LoginId,
                Username = task.AssignedUser.Username,
            },
            CreatedByUser = new ExternalUserRefResponse
            {
                LoginId = task.CreatedByUser.LoginId,
                Username = task.CreatedByUser.Username,
            },
            Content = task.Content,
            TaskType = new ExternalTaskTypeRefResponse
            {
                Code = task.TaskType.Code,
                Name = task.TaskType.Name,
            },
            Priority = task.Priority,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            EstimatedHours = task.EstimatedHours,
            ActualHours = task.ActualHours,
            ProgressPercentage = task.ProgressPercentage,
            IsCompleted = task.IsCompleted,
            CompletedAt = task.CompletedAt,
            CompletedByUser = task.CompletedByUser != null
                ? new ExternalUserRefResponse
                {
                    LoginId = task.CompletedByUser.LoginId,
                    Username = task.CompletedByUser.Username,
                }
                : null,
            Discarded = task.IsDiscarded
                ? new ExternalTaskDiscardedResponse
                {
                    DiscardedAt = task.DiscardedAt,
                    DiscardReason = task.DiscardReason,
                }
                : null,
            PredecessorTasks = predecessorTasks,
        };

        return new ExternalWorkspaceTaskDetailResponse
        {
            Workspace = new ExternalWorkspaceRefResponse
            {
                Code = workspace.Code ?? string.Empty,
            },
            Item = new ExternalItemRefResponse
            {
                ItemNumber = item.ItemNumber,
            },
            Task = taskDetail,
        };
    }

    /// <inheritdoc />
    public async Task<ExternalTaskCommentListResponse> GetTaskCommentsAsync(
        int organizationId,
        string workspaceIdOrCode,
        int itemNumber,
        int sequence,
        CancellationToken cancellationToken = default)
    {
        var (workspace, item) = await GetWorkspaceAndItemAsync(organizationId, workspaceIdOrCode, itemNumber, cancellationToken);

        var task = await context.WorkspaceTasks
            .AsNoTracking()
            .FirstOrDefaultAsync(
                t => t.WorkspaceItemId == item.Id && t.Sequence == sequence,
                cancellationToken);

        if (task == null)
        {
            throw new NotFoundException($"アイテム番号 '{itemNumber}' にタスクシーケンス番号 '{sequence}' が見つかりません。");
        }

        var comments = await context.TaskComments
            .AsNoTracking()
            .Include(tc => tc.User)
            .Where(tc => tc.WorkspaceTaskId == task.Id && !tc.IsDeleted)
            .OrderBy(tc => tc.CreatedAt)
            .ToListAsync(cancellationToken);

        var commentResponses = comments.Select(tc => new ExternalTaskCommentResponse
        {
            Id = tc.Id,
            User = new ExternalUserRefResponse
            {
                LoginId = tc.User.LoginId,
                Username = tc.User.Username,
            },
            Content = tc.Content,
            CommentType = tc.CommentType,
        }).ToList();

        return new ExternalTaskCommentListResponse
        {
            Workspace = new ExternalWorkspaceRefResponse
            {
                Code = workspace.Code ?? string.Empty,
            },
            Item = new ExternalItemRefResponse
            {
                ItemNumber = item.ItemNumber,
            },
            Task = new ExternalTaskRefResponse
            {
                Sequence = task.Sequence,
            },
            Comments = commentResponses,
        };
    }

    private async Task<(Workspace Workspace, WorkspaceItem Item)> GetWorkspaceAndItemAsync(
        int organizationId,
        string workspaceIdOrCode,
        int itemNumber,
        CancellationToken cancellationToken)
    {
        var isNumeric = int.TryParse(workspaceIdOrCode, out var numericId);
        var workspace = await context.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(
                w => w.OrganizationId == organizationId &&
                     (w.Code == workspaceIdOrCode || (isNumeric && w.Id == numericId)),
                cancellationToken);

        if (workspace == null)
        {
            throw new NotFoundException($"ワークスペース '{workspaceIdOrCode}' が見つかりません。");
        }

        var item = await context.WorkspaceItems
            .AsNoTracking()
            .FirstOrDefaultAsync(
                wi => wi.WorkspaceId == workspace.Id && wi.ItemNumber == itemNumber && wi.IsActive,
                cancellationToken);

        if (item == null)
        {
            throw new NotFoundException($"ワークスペース '{workspaceIdOrCode}' にアイテム番号 '{itemNumber}' が見つかりません。");
        }

        return (workspace, item);
    }
}