using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI.Provider.DeepSeek;

/// <summary>
/// DeepSeek APIクライアントのインターフェース
/// </summary>
public interface IDeepSeekClient
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

    /// <summary>
    /// シンプルなテキスト生成
    /// </summary>
    /// <param name="systemPrompt">システムプロンプト</param>
    /// <param name="userPrompt">ユーザープロンプト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたテキスト</returns>
    Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// タイトルからMarkdown本文を生成
    /// </summary>
    /// <param name="title">タイトル</param>
    /// <param name="additionalContext">追加のコンテキスト情報（オプション）</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたMarkdownテキスト</returns>
    Task<string> GenerateMarkdownFromTitleAsync(
        string title,
        string? additionalContext = null,
        CancellationToken cancellationToken = default);
}
