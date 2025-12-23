using Microsoft.Extensions.Logging;
using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI;

/// <summary>
/// メッセージの感情分析を行うサービス
/// </summary>
public class MessageAnalyzer : IMessageAnalyzer
{
    private readonly ILogger<MessageAnalyzer> _logger;

    /// <summary>
    /// MessageAnalyzer のコンストラクタ
    /// </summary>
    public MessageAnalyzer(ILogger<MessageAnalyzer> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// 感情分析用のシステムプロンプト
    /// </summary>
    private const string AnalysisSystemPrompt = """
        あなたはメッセージの感情分析を行う専門家です。
        ユーザーから送られたメッセージを分析し、以下の項目を0〜100のスコアで評価してください。

        評価項目:
        - TroubledScore: 困っている・悩んでいる度合い（0=全く困っていない、100=非常に困っている）
        - NegativeScore: ネガティブな感情の度合い（0=ネガティブ要素なし、100=非常にネガティブ）
          - 不満、怒り、悲しみ、失望、イライラなどを含む
        - PositiveScore: ポジティブな感情の度合い（0=ポジティブ要素なし、100=非常にポジティブ）
          - 喜び、感謝、満足、期待、興奮などを含む
        - UrgencyScore: 緊急度（0=急ぎではない、100=今すぐ対応が必要）
        - PrimaryEmotion: 主な感情カテゴリ（例: "困惑", "不安", "怒り", "悲しみ", "喜び", "感謝", "中立" など）
        - Confidence: 分析の確信度（0=自信なし、100=非常に確信）
        - Summary: 分析結果の簡潔な説明（30文字以内の日本語）

        判定のヒント:
        - 「〜できない」「〜わからない」「どうすれば」「困った」「助けて」などは困っているサイン
        - 「ありがとう」「助かった」「嬉しい」などはポジティブなサイン
        - 「至急」「急ぎ」「すぐに」「今日中」などは緊急度が高いサイン
        - 絵文字や感嘆符の使い方も感情の手がかりになる
        - 複数の感情が混在する場合もある（例: 困っているが感謝もしている）

        必ず有効なJSONのみを返してください。説明文は不要です。
        """;

    /// <inheritdoc />
    public async Task<MessageSentimentResult> AnalyzeAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            _logger.LogDebug("Empty message provided, returning neutral result");
            return CreateNeutralResult();
        }

        try
        {
            var result = await aiClient.GenerateJsonAsync<MessageSentimentResult>(
                AnalysisSystemPrompt,
                $"以下のメッセージを分析してください:\n\n{message}",
                cancellationToken: cancellationToken
            );

            _logger.LogDebug(
                "Sentiment analysis completed: PrimaryEmotion={PrimaryEmotion}, Troubled={TroubledScore}, Negative={NegativeScore}, Positive={PositiveScore}, Urgency={UrgencyScore}, Confidence={Confidence}",
                result.PrimaryEmotion,
                result.TroubledScore,
                result.NegativeScore,
                result.PositiveScore,
                result.UrgencyScore,
                result.Confidence
            );

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Sentiment analysis failed, returning neutral result");
            return CreateNeutralResult("分析に失敗しました");
        }
    }

    /// <inheritdoc />
    public async Task<bool> IsTroubledAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default)
    {
        var result = await AnalyzeAsync(aiClient, message, cancellationToken);
        return result.IsTroubled;
    }

    /// <inheritdoc />
    public async Task<bool> IsUrgentAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default)
    {
        var result = await AnalyzeAsync(aiClient, message, cancellationToken);
        return result.IsUrgent;
    }

    /// <inheritdoc />
    public async Task<bool> NeedsAttentionAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default)
    {
        var result = await AnalyzeAsync(aiClient, message, cancellationToken);
        return result.NeedsAttention;
    }

    /// <summary>
    /// 中立的なデフォルト結果を作成する
    /// </summary>
    private static MessageSentimentResult CreateNeutralResult(string? summary = null)
    {
        return new MessageSentimentResult
        {
            TroubledScore = 0,
            NegativeScore = 0,
            PositiveScore = 0,
            UrgencyScore = 0,
            PrimaryEmotion = "中立",
            Confidence = summary == null ? 100 : 0,
            Summary = summary ?? "分析対象なし",
        };
    }
}