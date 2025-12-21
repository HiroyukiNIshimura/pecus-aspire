namespace Pecus.Libs.AI;

/// <summary>
/// AIメッセージの役割
/// </summary>
public enum MessageRole
{
    /// <summary>
    /// システム指示（AIの振る舞いを定義）
    /// </summary>
    System,

    /// <summary>
    /// ユーザーからの入力
    /// </summary>
    User,

    /// <summary>
    /// AIアシスタントの応答
    /// </summary>
    Assistant
}

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
    /// <param name="persona">ペルソナ（オプション）。指定時は最初のsystemプロンプトとして送信</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたテキスト</returns>
    Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// メッセージ配列を指定してテキストを生成
    /// system/user/assistantメッセージを任意の順番で指定可能
    /// </summary>
    /// <param name="messages">メッセージの配列（Role: 役割, Content: 内容）</param>
    /// <param name="persona">ペルソナ（オプション）。指定時は最初のsystemプロンプトとして送信</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたテキスト</returns>
    Task<string> GenerateTextWithMessagesAsync(
        IEnumerable<(MessageRole Role, string Content)> messages,
        string? persona = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 構造化されたJSONレスポンスを生成
    /// </summary>
    /// <typeparam name="T">デシリアライズする型</typeparam>
    /// <param name="systemPrompt">システムプロンプト（JSON形式の指示は自動付与）</param>
    /// <param name="userPrompt">ユーザープロンプト</param>
    /// <param name="persona">ペルソナ（オプション）。指定時は最初のsystemプロンプトとして送信</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>デシリアライズされたオブジェクト</returns>
    Task<T> GenerateJsonAsync<T>(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default) where T : class;

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
    Task<IReadOnlyList<Models.AvailableModel>> GetAvailableModelsAsync(
        string apiKey,
        CancellationToken cancellationToken = default);
}