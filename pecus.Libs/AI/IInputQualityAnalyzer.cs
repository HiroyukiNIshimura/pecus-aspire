using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI;

/// <summary>
/// 入力テキストの品質を判定するアナライザーのインターフェース
/// </summary>
public interface IInputQualityAnalyzer
{
    /// <summary>
    /// 入力テキストの品質を分析する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="message">分析対象のテキスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>品質判定結果</returns>
    Task<InputQualityResult> AnalyzeAsync(
        IAiClient aiClient,
        string? message,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 入力が有効かどうかを簡易判定する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="message">判定対象のテキスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>有効な場合は true</returns>
    Task<bool> IsValidInputAsync(
        IAiClient aiClient,
        string? message,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 特定ワードを含むかどうかを判定する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="message">判定対象のテキスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>特定ワードを含む場合は true</returns>
    Task<bool> ContainsSpecialKeywordAsync(
        IAiClient aiClient,
        string? message,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 意味不明な入力（乱打・Typo等）かどうかを判定する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="message">判定対象のテキスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>意味不明な入力の場合は true</returns>
    Task<bool> IsGibberishAsync(
        IAiClient aiClient,
        string? message,
        CancellationToken cancellationToken = default);
}