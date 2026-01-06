using Pecus.Libs.Information.Models;

namespace Pecus.Libs.Information;

/// <summary>
/// 情報検索プロバイダーのインターフェース
/// ユーザーが「〜について知りたい」という場合に関連情報を検索する
/// </summary>
public interface IInformationSearchProvider
{
    /// <summary>
    /// ユーザーがアクセス可能なワークスペースから情報を検索
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="searchTopic">検索トピック（InformationTopic から抽出された内容）</param>
    /// <param name="limit">検索結果の上限</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>検索結果</returns>
    Task<InformationSearchResult> SearchAsync(
        int userId,
        string searchTopic,
        int limit = 5,
        CancellationToken cancellationToken = default);
}
