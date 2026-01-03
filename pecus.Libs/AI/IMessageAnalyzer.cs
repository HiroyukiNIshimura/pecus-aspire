using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI;

/// <summary>
/// メッセージの感情分析を行うサービスのインターフェース
/// </summary>
public interface IMessageAnalyzer
{
    /// <summary>
    /// メッセージの感情分析を実行する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="message">分析対象のメッセージ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>感情分析結果</returns>
    Task<MessageSentimentResult> AnalyzeAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// メッセージが困っている内容かどうかを簡易判定する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="message">判定対象のメッセージ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>困っている場合は true</returns>
    Task<bool> IsTroubledAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// メッセージが緊急性の高い内容かどうかを簡易判定する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="message">判定対象のメッセージ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>緊急性が高い場合は true</returns>
    Task<bool> IsUrgentAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// メッセージが注意が必要かどうかを簡易判定する
    /// （困っている or ネガティブ or 緊急）
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="message">判定対象のメッセージ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>注意が必要な場合は true</returns>
    Task<bool> NeedsAttentionAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// メッセージが指示・ガイダンスを求めている内容かどうかを簡易判定する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="message">判定対象のメッセージ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>指示・ガイダンスを求めている場合は true</returns>
    Task<bool> IsSeekingGuidanceAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default);
}