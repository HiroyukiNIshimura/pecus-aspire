using Pecus.Libs.Statistics.Models;

namespace Pecus.Libs.Statistics;

/// <summary>
/// 統計データ収集サービスのインターフェース
/// 組織・ワークスペース・ユーザーレベルの統計情報を提供
/// </summary>
public interface IStatisticsCollector
{
    /// <summary>
    /// 組織のアクティブなワークスペースID一覧を取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>アクティブなワークスペースIDのリスト</returns>
    Task<List<int>> GetActiveWorkspaceIdsAsync(
        int organizationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 組織レベルのタスク統計を取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>タスク統計</returns>
    Task<TaskStatistics> GetOrganizationTaskStatisticsAsync(
        int organizationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// ワークスペースレベルのタスク統計を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>タスク統計</returns>
    Task<TaskStatistics> GetWorkspaceTaskStatisticsAsync(
        int workspaceId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// ユーザーレベルのタスク統計を取得（組織内）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="userId">ユーザーID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>タスク統計</returns>
    Task<TaskStatistics> GetUserTaskStatisticsAsync(
        int organizationId,
        int userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 組織レベルのアイテム統計を取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>アイテム統計</returns>
    Task<ItemStatistics> GetOrganizationItemStatisticsAsync(
        int organizationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// ワークスペースレベルのアイテム統計を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>アイテム統計</returns>
    Task<ItemStatistics> GetWorkspaceItemStatisticsAsync(
        int workspaceId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 組織のアクティブメンバー数を取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>メンバー数</returns>
    Task<int> GetOrganizationMemberCountAsync(
        int organizationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// ワークスペースのメンバー数を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>メンバー数</returns>
    Task<int> GetWorkspaceMemberCountAsync(
        int workspaceId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 組織内のアクティビティ数を取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="since">この日時以降のアクティビティを対象</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>アクティビティ数</returns>
    Task<int> GetOrganizationActivityCountAsync(
        int organizationId,
        DateTimeOffset since,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// ワークスペース内のアクティビティ数を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="since">この日時以降のアクティビティを対象</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>アクティビティ数</returns>
    Task<int> GetWorkspaceActivityCountAsync(
        int workspaceId,
        DateTimeOffset since,
        CancellationToken cancellationToken = default);
}
