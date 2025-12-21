using Pecus.Libs.AI.Models;
using Pecus.Libs.AI.Models.Gemini;

namespace Pecus.Libs.AI.Provider.Gemini;

/// <summary>
/// Gemini APIクライアントのインターフェース
/// </summary>
public interface IGeminiClient
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

    /// <summary>
    /// シンプルなテキスト生成
    /// </summary>
    /// <param name="systemPrompt">システムプロンプト</param>
    /// <param name="userPrompt">ユーザープロンプト</param>
    /// <param name="persona">ペルソナ（オプション）。指定時は最初のsystemプロンプトとして送信</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたテキスト</returns>
    Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// タイトルからMarkdown本文を生成
    /// </summary>
    /// <param name="title">タイトル</param>
    /// <param name="additionalContext">追加のコンテキスト情報（オプション）</param>
    /// <param name="persona">ペルソナ（オプション）。指定時は最初のsystemプロンプトとして送信</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたMarkdownテキスト</returns>
    Task<string> GenerateMarkdownFromTitleAsync(
        string title,
        string? additionalContext = null,
        string? persona = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 利用可能なモデル一覧を取得
    /// </summary>
    /// <param name="apiKey">APIキー</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>利用可能なモデルのリスト</returns>
    Task<IReadOnlyList<AvailableModel>> GetAvailableModelsAsync(
        string apiKey,
        CancellationToken cancellationToken = default);
}