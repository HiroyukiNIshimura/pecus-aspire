using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI.Tools;

/// <summary>
/// ツール実行のコンテキスト
/// </summary>
public record AiToolContext
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public required int UserId { get; init; }

    /// <summary>
    /// 組織ID（アジェンダ取得等に使用）
    /// </summary>
    public int? OrganizationId { get; init; }

    /// <summary>
    /// ユーザーのタイムゾーン（IANA形式、例: "Asia/Tokyo"）
    /// </summary>
    public string? UserTimeZone { get; init; }

    /// <summary>
    /// ユーザーのメッセージ（トリガー）
    /// </summary>
    public string? UserMessage { get; init; }

    /// <summary>
    /// メッセージの感情分析結果
    /// </summary>
    public MessageSentimentResult? SentimentResult { get; init; }

    /// <summary>
    /// Function Calling からの引数（JSON形式）
    /// AI が直接ツールを呼び出す際に使用
    /// </summary>
    public Dictionary<string, object>? FunctionArguments { get; init; }
}