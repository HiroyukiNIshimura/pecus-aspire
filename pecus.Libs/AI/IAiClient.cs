namespace Pecus.Libs.AI;

/// <summary>
/// AIクライアントの共通インターフェース
/// バックエンド内部で使用するAI機能の抽象化層
/// </summary>
public interface IAiClient
{
    /// <summary>
    /// テキストを生成
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
    /// 構造化されたJSONレスポンスを生成
    /// </summary>
    /// <typeparam name="T">デシリアライズする型</typeparam>
    /// <param name="systemPrompt">システムプロンプト（JSON形式の指示は自動付与）</param>
    /// <param name="userPrompt">ユーザープロンプト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>デシリアライズされたオブジェクト</returns>
    Task<T> GenerateJsonAsync<T>(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default) where T : class;

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
