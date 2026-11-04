using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI.Provider.Kimi;

/// <summary>
/// Kimi (Moonshot) APIクライアントのインターフェース
/// </summary>
public interface IKimiClient : IAiClient
{
    /// <summary>
    /// Chat Completionを実行
    /// </summary>
    /// <param name="request">リクエスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>レスポンス</returns>
    Task<ChatCompletionResponse> ChatCompletionAsync(
        ChatCompletionRequest request,
        CancellationToken cancellationToken = default);
}
