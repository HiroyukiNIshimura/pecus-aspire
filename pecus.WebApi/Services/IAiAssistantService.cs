using Pecus.Models.Requests.AiAssistant;

namespace Pecus.Services;

/// <summary>
/// AIアシスタントサービスインターフェース
/// </summary>
public interface IAiAssistantService
{
    /// <summary>
    /// エディタ内のカーソル位置に挿入するテキストを生成
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="request">テキスト生成リクエスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたテキスト（Markdown形式）。生成できない場合はnull</returns>
    Task<string?> GenerateTextAsync(
        int organizationId,
        GenerateTextRequest request,
        CancellationToken cancellationToken = default);
}
