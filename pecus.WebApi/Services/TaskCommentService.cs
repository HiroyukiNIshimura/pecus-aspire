using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Config;

namespace Pecus.Services;

/// <summary>
/// タスクコメントサービス
/// </summary>
public class TaskCommentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TaskCommentService> _logger;
    private readonly PecusConfig _config;

    public TaskCommentService(
        ApplicationDbContext context,
        ILogger<TaskCommentService> logger,
        PecusConfig config
    )
    {
        _context = context;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// タスクコメントを作成
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="request">作成リクエスト</param>
    /// <param name="userId">コメントするユーザーID</param>
    /// <returns>作成されたコメント</returns>
    public async Task<TaskComment> CreateTaskCommentAsync(
        int workspaceId,
        int itemId,
        int taskId,
        CreateTaskCommentRequest request,
        int userId
    )
    {
        // タスクの存在確認
        var taskExists = await _context.WorkspaceTasks
            .AnyAsync(t =>
                t.Id == taskId &&
                t.WorkspaceItemId == itemId &&
                t.WorkspaceId == workspaceId
            );

        if (!taskExists)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var comment = new TaskComment
        {
            WorkspaceTaskId = taskId,
            UserId = userId,
            Content = request.Content,
            CommentType = request.CommentType,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            IsDeleted = false,
        };

        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync();

        _logger.LogDebug(
            "タスクコメントを作成しました。CommentId={CommentId}, TaskId={TaskId}, UserId={UserId}",
            comment.Id,
            taskId,
            userId
        );

        // ナビゲーションプロパティを読み込み
        await _context.Entry(comment)
            .Reference(c => c.User)
            .LoadAsync();

        return comment;
    }

    /// <summary>
    /// タスクコメントを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="commentId">コメントID</param>
    /// <returns>コメント</returns>
    public async Task<TaskComment> GetTaskCommentAsync(
        int workspaceId,
        int itemId,
        int taskId,
        int commentId
    )
    {
        // タスクの存在確認
        var taskExists = await _context.WorkspaceTasks
            .AnyAsync(t =>
                t.Id == taskId &&
                t.WorkspaceItemId == itemId &&
                t.WorkspaceId == workspaceId
            );

        if (!taskExists)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var comment = await _context.TaskComments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c =>
                c.Id == commentId &&
                c.WorkspaceTaskId == taskId
            );

        if (comment == null)
        {
            throw new NotFoundException("コメントが見つかりません。");
        }

        return comment;
    }

    /// <summary>
    /// タスクコメント一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="request">フィルタリング・ページネーションリクエスト</param>
    /// <returns>コメント一覧と総件数のタプル</returns>
    public async Task<(List<TaskComment> Comments, int TotalCount)> GetTaskCommentsAsync(
        int workspaceId,
        int itemId,
        int taskId,
        GetTaskCommentsRequest request
    )
    {
        // タスクの存在確認
        var taskExists = await _context.WorkspaceTasks
            .AnyAsync(t =>
                t.Id == taskId &&
                t.WorkspaceItemId == itemId &&
                t.WorkspaceId == workspaceId
            );

        if (!taskExists)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var query = _context.TaskComments
            .Include(c => c.User)
            .Where(c => c.WorkspaceTaskId == taskId);

        // 削除されたコメントを含めるかどうか
        if (!request.IncludeDeleted)
        {
            query = query.Where(c => !c.IsDeleted);
        }

        // コメントタイプでフィルタ
        if (request.CommentType.HasValue)
        {
            query = query.Where(c => c.CommentType == request.CommentType.Value);
        }

        // 総件数を取得
        var totalCount = await query.CountAsync();

        // ページネーション
        var pageSize = _config.Pagination.DefaultPageSize;
        var comments = await query
            .OrderBy(c => c.CreatedAt)
            .Skip((request.Page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (comments, totalCount);
    }

    /// <summary>
    /// タスクコメントを更新（作成者のみ可能）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="commentId">コメントID</param>
    /// <param name="request">更新リクエスト</param>
    /// <param name="userId">操作するユーザーID</param>
    /// <returns>更新されたコメント</returns>
    public async Task<TaskComment> UpdateTaskCommentAsync(
        int workspaceId,
        int itemId,
        int taskId,
        int commentId,
        UpdateTaskCommentRequest request,
        int userId
    )
    {
        // タスクの存在確認
        var taskExists = await _context.WorkspaceTasks
            .AnyAsync(t =>
                t.Id == taskId &&
                t.WorkspaceItemId == itemId &&
                t.WorkspaceId == workspaceId
            );

        if (!taskExists)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var comment = await _context.TaskComments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c =>
                c.Id == commentId &&
                c.WorkspaceTaskId == taskId
            );

        if (comment == null)
        {
            throw new NotFoundException("コメントが見つかりません。");
        }

        // 作成者のみが編集可能
        if (comment.UserId != userId)
        {
            throw new InvalidOperationException("コメントの編集は作成者のみ可能です。");
        }

        // 削除済みコメントは編集不可
        if (comment.IsDeleted)
        {
            throw new InvalidOperationException("削除済みのコメントは編集できません。");
        }

        // コメント内容を更新（nullでない場合のみ、コメントタイプは変更不可）
        if (request.Content != null)
        {
            comment.Content = request.Content;
        }

        comment.UpdatedAt = DateTimeOffset.UtcNow;

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(comment).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            var latestComment = await _context.TaskComments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            throw new ConcurrencyException<TaskCommentDetailResponse>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestComment != null ? BuildCommentDetailResponse(latestComment) : null
            );
        }

        _logger.LogDebug(
            "タスクコメントを更新しました。CommentId={CommentId}, TaskId={TaskId}, UserId={UserId}",
            comment.Id,
            taskId,
            userId
        );

        return comment;
    }

    /// <summary>
    /// タスクコメントを削除（論理削除、作成者のみ可能）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="taskId">タスクID</param>
    /// <param name="commentId">コメントID</param>
    /// <param name="request">削除リクエスト</param>
    /// <param name="userId">操作するユーザーID</param>
    /// <returns>削除されたコメント</returns>
    public async Task<TaskComment> DeleteTaskCommentAsync(
        int workspaceId,
        int itemId,
        int taskId,
        int commentId,
        DeleteTaskCommentRequest request,
        int userId
    )
    {
        // タスクの存在確認
        var taskExists = await _context.WorkspaceTasks
            .AnyAsync(t =>
                t.Id == taskId &&
                t.WorkspaceItemId == itemId &&
                t.WorkspaceId == workspaceId
            );

        if (!taskExists)
        {
            throw new NotFoundException("タスクが見つかりません。");
        }

        var comment = await _context.TaskComments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c =>
                c.Id == commentId &&
                c.WorkspaceTaskId == taskId
            );

        if (comment == null)
        {
            throw new NotFoundException("コメントが見つかりません。");
        }

        // 作成者のみが削除可能
        if (comment.UserId != userId)
        {
            throw new InvalidOperationException("コメントの削除は作成者のみ可能です。");
        }

        // 既に削除済みの場合
        if (comment.IsDeleted)
        {
            throw new InvalidOperationException("このコメントは既に削除されています。");
        }

        // 論理削除を実行
        comment.IsDeleted = true;
        comment.DeletedAt = DateTime.UtcNow;
        comment.UpdatedAt = DateTimeOffset.UtcNow;

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(comment).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            var latestComment = await _context.TaskComments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            throw new ConcurrencyException<TaskCommentDetailResponse>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestComment != null ? BuildCommentDetailResponse(latestComment) : null
            );
        }

        _logger.LogDebug(
            "タスクコメントを削除しました。CommentId={CommentId}, TaskId={TaskId}, UserId={UserId}",
            comment.Id,
            taskId,
            userId
        );

        return comment;
    }

    /// <summary>
    /// メール送信用にタスク情報を詳細取得（担当者、ワークスペース、アイテム、組織情報を含む）
    /// </summary>
    /// <param name="taskId">タスクID</param>
    /// <returns>タスク情報（存在しない場合はnull）</returns>
    public async Task<WorkspaceTask?> GetTaskWithDetailsForEmailAsync(int taskId)
    {
        return await _context.WorkspaceTasks
            .Include(t => t.AssignedUser)
            .Include(t => t.Workspace)
            .Include(t => t.WorkspaceItem)
            .Include(t => t.Organization)
            .FirstOrDefaultAsync(t => t.Id == taskId);
    }

    /// <summary>
    /// TaskCommentエンティティからレスポンスを生成（内部ヘルパー）
    /// </summary>
    private static TaskCommentDetailResponse BuildCommentDetailResponse(TaskComment comment)
    {
        return new TaskCommentDetailResponse
        {
            Id = comment.Id,
            WorkspaceTaskId = comment.WorkspaceTaskId,
            User = UserIdentityResponseBuilder.FromUserWithId(comment.UserId, comment.User),
            Content = comment.Content,
            CommentType = comment.CommentType,
            IsDeleted = comment.IsDeleted,
            DeletedAt = comment.DeletedAt,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            RowVersion = comment.RowVersion,
        };
    }

    /// <summary>
    /// ヘルプ通知先のユーザー一覧を取得（OrganizationSettingのHelpNotificationTargetに基づく）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="excludeUserId">除外するユーザーID（コメント作成者）</param>
    /// <returns>通知先ユーザー一覧（メールアドレスを持つ有効なユーザーのみ）</returns>
    public async Task<List<User>> GetHelpNotificationTargetUsersAsync(
        int organizationId,
        int workspaceId,
        int excludeUserId
    )
    {
        // 組織設定を取得
        var setting = await _context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

        var helpTarget = setting?.HelpNotificationTarget ?? HelpNotificationTarget.WorkspaceUsers;

        List<User> users;

        if (helpTarget == HelpNotificationTarget.Organization)
        {
            // 組織全体の有効なユーザーを取得
            users = await _context.Users
                .Where(u =>
                    u.OrganizationId == organizationId &&
                    u.IsActive &&
                    u.Email != null &&
                    u.Id != excludeUserId
                )
                .ToListAsync();
        }
        else
        {
            // ワークスペースの有効なメンバーを取得
            users = await _context.WorkspaceUsers
                .Include(wu => wu.User)
                .Where(wu =>
                    wu.WorkspaceId == workspaceId &&
                    wu.User != null &&
                    wu.User.IsActive &&
                    wu.User.Email != null &&
                    wu.UserId != excludeUserId
                )
                .Select(wu => wu.User!)
                .ToListAsync();
        }

        return users;
    }
}