using Pecus.Models.Responses.External;

namespace Pecus.Services;

/// <summary>
/// 外部API経由でワークスペースアイテムを操作するサービスのインターフェース
/// </summary>
public interface IExternalWorkspaceItemService
{
    /// <summary>
    /// ワークスペース内の全アイテムを取得（ページネーション対応）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="page">ページ番号（1始まり）</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>アイテム一覧レスポンス</returns>
    Task<ExternalItemListResponse> GetWorkspaceItemsAsync(
        int organizationId,
        string workspaceIdOrCode,
        int page,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 指定したワークスペース内のアイテムを取得（アイテム連番指定）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="itemNumber">アイテム番号（ワークスペース内連番）</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>アイテム詳細レスポンス</returns>
    Task<ExternalItemResponse> GetWorkspaceItemAsync(
        int organizationId,
        string workspaceIdOrCode,
        int itemNumber,
        CancellationToken cancellationToken = default);
}