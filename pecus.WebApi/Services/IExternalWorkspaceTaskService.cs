using Pecus.Models.Responses.External;

namespace Pecus.Services;

/// <summary>
/// 外部API経由でワークスペースタスクを操作するサービスインターフェース
/// </summary>
public interface IExternalWorkspaceTaskService
{
    /// <summary>
    /// 指定ワークスペース・アイテム内のタスク一覧を取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="itemNumber">アイテム番号</param>
    /// <param name="isCompleted">完了フラグフィルタ（nullの場合は全件）</param>
    /// <param name="isDiscarded">破棄フラグフィルタ（nullの場合は全件）</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>タスク一覧レスポンス</returns>
    Task<ExternalWorkspaceTaskListResponse> GetTasksAsync(
        int organizationId,
        string workspaceIdOrCode,
        int itemNumber,
        bool? isCompleted = null,
        bool? isDiscarded = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 指定ワークスペース・アイテム内の指定タスク詳細を取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="itemNumber">アイテム番号</param>
    /// <param name="sequence">タスクシーケンス番号</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>タスク詳細レスポンス</returns>
    Task<ExternalWorkspaceTaskDetailResponse> GetTaskAsync(
        int organizationId,
        string workspaceIdOrCode,
        int itemNumber,
        int sequence,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 指定ワークスペース・アイテム内の指定タスクの全コメントを取得する（論理削除除外）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="itemNumber">アイテム番号</param>
    /// <param name="sequence">タスクシーケンス番号</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>タスクコメント一覧レスポンス</returns>
    Task<ExternalTaskCommentListResponse> GetTaskCommentsAsync(
        int organizationId,
        string workspaceIdOrCode,
        int itemNumber,
        int sequence,
        CancellationToken cancellationToken = default);
}