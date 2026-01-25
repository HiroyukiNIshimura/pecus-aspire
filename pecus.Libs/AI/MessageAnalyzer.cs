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
        - GuidanceSeekingScore: 指示・ガイダンスを求めている度合い（0=求めていない、100=明確に次のアクションを求めている）
          - 「何をすればいい」「どうしたらいい」「次は何を」「教えてください」などを含む
        - InformationSeekingScore: 情報・知識を求めている度合い（0=求めていない、100=強く知りたがっている）
          - 「○○について知りたい」「○○がわからない」「○○の意味は？」「○○って何？」などを含む
        - InformationTopic: 情報を求めている対象（○○の部分）を抽出。複数ある場合はカンマ区切り。ない場合はnull。
          - 例: 「マイクロサービスについて知りたい」→ "マイクロサービス"
          - 例: 「APIとRESTの違いがわからない」→ "API, REST, その違い"
        - OthersFocusScore: 他者への関心度（0=自分のことを気にしている、100=他人/チームのことを気にしている）
          - 自分のタスク・状況について → 0〜30
          - 曖昧な場合（誰のタスクか不明） → 30〜50
          - 他人やチームのことを気にしている → 60〜100
        - TargetSubject: 誰についての話か（"Self", "SpecificOther", "Team", "General"）
          - Self: 自分自身（「私の〜」「今日は何から始める？」「やることある？」）
          - SpecificOther: 特定の他者（「〇〇さんの進捗は？」「彼女の状況は？」）
          - Team: チーム/組織（「手伝えそうなタスクは？」「誰か困ってない？」「チームの状況は？」）
          - General: 不明/一般的
        - PrimaryEmotion: 主な感情カテゴリ（例: "困惑", "不安", "怒り", "悲しみ", "喜び", "感謝", "中立" など）
        - Confidence: 分析の確信度（0=自信なし、100=非常に確信）
        - Summary: 分析結果の簡潔な説明（30文字以内の日本語）

        判定のヒント:
        - 「〜できない」「〜わからない」「どうすれば」「困った」「助けて」などは困っているサイン
        - 「○○について知りたい」「○○がわからない」「○○って何？」「○○の意味は？」などは情報探索のサイン
        - 「ありがとう」「助かった」「嬉しい」などはポジティブなサイン
        - 「至急」「急ぎ」「すぐに」「今日中」などは緊急度が高いサイン
        - 「何をすればいい」「どうしたらいい」「次はどうすれば」「やり方を教えて」「手順を教えて」などは指示を求めているサイン
        - 質問形式で具体的なアクションや方法を尋ねている場合はGuidanceSeekingScoreを高くする
        - 質問形式で知識や情報を尋ねている場合はInformationSeekingScoreを高くする
        - 絵文字や感嘆符の使い方も感情の手がかりになる
        - 複数の感情が混在する場合もある（例: 困っているが感謝もしている）
        - 意味不明な文字列で感情分析不能な場合は全スコアを0にし、PrimaryEmotionを「中立」、Confidenceを0に設定

        OthersFocusScore/TargetSubject の判定ヒント:
        - 「今日は何から始める？」「私のタスクは？」→ OthersFocusScore: 0〜20, TargetSubject: Self
        - 「期限が近いタスクは？」→ 文脈不明のため OthersFocusScore: 30〜50, TargetSubject: General（自分のことが多い）
        - 「手伝えそうなタスクは？」「サポートできることある？」→ OthersFocusScore: 80〜100, TargetSubject: Team
        - 「〇〇さんの進捗は？」「彼の状況どう？」→ OthersFocusScore: 70〜90, TargetSubject: SpecificOther
        - 「チームで困ってる人いる？」「誰か助けが必要？」→ OthersFocusScore: 80〜100, TargetSubject: Team

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
                "Sentiment analysis completed: PrimaryEmotion={PrimaryEmotion}, Troubled={TroubledScore}, Negative={NegativeScore}, Positive={PositiveScore}, Urgency={UrgencyScore}, GuidanceSeeking={GuidanceSeekingScore}, InformationSeeking={InformationSeekingScore}, InformationTopic={InformationTopic}, OthersFocus={OthersFocusScore}, TargetSubject={TargetSubject}, Confidence={Confidence}",
                result.PrimaryEmotion,
                result.TroubledScore,
                result.NegativeScore,
                result.PositiveScore,
                result.UrgencyScore,
                result.GuidanceSeekingScore,
                result.InformationSeekingScore,
                result.InformationTopic,
                result.OthersFocusScore,
                result.TargetSubject,
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

    /// <inheritdoc />
    public async Task<bool> IsSeekingGuidanceAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default)
    {
        var result = await AnalyzeAsync(aiClient, message, cancellationToken);
        return result.IsSeekingGuidance;
    }

    /// <inheritdoc />
    public async Task<bool> IsSeekingInformationAsync(
        IAiClient aiClient,
        string message,
        CancellationToken cancellationToken = default)
    {
        var result = await AnalyzeAsync(aiClient, message, cancellationToken);
        return result.IsSeekingInformation;
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
            GuidanceSeekingScore = 0,
            InformationSeekingScore = 0,
            OthersFocusScore = 0,
            TargetSubject = TargetSubject.Self,
            PrimaryEmotion = "中立",
            Confidence = summary == null ? 100 : 0,
            Summary = summary ?? "分析対象なし",
        };
    }
}