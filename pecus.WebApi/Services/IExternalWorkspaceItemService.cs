using Pecus.Models.Requests.External;
using Pecus.Models.Responses.External;

namespace Pecus.Services;

/// <summary>
/// 外部API経由でワークスペースアイテムを操作するサービスのインターフェース
/// </summary>
public interface IExternalWorkspaceItemService
{
    /// <summary>
    /// ワークスペースアイテムを作成する
    /// </summary>
    /// <param name="organizationId">認証済みAPIキーの組織ID</param>
    /// <param name="workspaceCode">ワークスペースコード</param>
    /// <param name="request">作成リクエスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>作成されたアイテム情報</returns>
    Task<CreateExternalWorkspaceItemResponse> CreateItemAsync(
        int organizationId,
        string workspaceCode,
        CreateExternalWorkspaceItemRequest request,
        CancellationToken cancellationToken = default);
}