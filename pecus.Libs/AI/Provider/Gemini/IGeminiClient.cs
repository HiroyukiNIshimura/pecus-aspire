using Pecus.Libs.AI.Models;
using Pecus.Libs.AI.Models.Gemini;

namespace Pecus.Libs.AI.Provider.Gemini;

/// <summary>
/// Gemini APIクライアントのインターフェース
/// </summary>
public interface IGeminiClient : IAiClient
{
    /// <summary>
    /// Generate Contentを実行
    /// </summary>
    /// <param name="request">リクエスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>レスポンス</returns>
    Task<GeminiResponse> GenerateContentAsync(
        GeminiRequest request,
        CancellationToken cancellationToken = default);
}
