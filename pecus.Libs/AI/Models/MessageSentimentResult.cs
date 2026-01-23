namespace Pecus.Libs.AI.Models;

/// <summary>
/// メッセージの感情分析結果
/// </summary>
public class MessageSentimentResult
{
    /// <summary>
    /// 困っている・悩んでいる度合い (0-100)
    /// </summary>
    public int TroubledScore { get; set; }

    /// <summary>
    /// ネガティブ度合い (0-100)
    /// 不満・怒り・悲しみなど
    /// </summary>
    public int NegativeScore { get; set; }

    /// <summary>
    /// ポジティブ度合い (0-100)
    /// 喜び・感謝・満足など
    /// </summary>
    public int PositiveScore { get; set; }

    /// <summary>
    /// 緊急度 (0-100)
    /// すぐに対応が必要な度合い
    /// </summary>
    public int UrgencyScore { get; set; }

    /// <summary>
    /// 指示・ガイダンスを求めている度合い (0-100)
    /// 「何をすればいい」「どうしたらいい」など次のアクションを求めている度合い
    /// </summary>
    public int GuidanceSeekingScore { get; set; }

    /// <summary>
    /// 情報・知識を求めている度合い (0-100)
    /// 「○○について知りたい」「○○がわからない」など情報を求めている度合い
    /// </summary>
    public int InformationSeekingScore { get; set; }

    /// <summary>
    /// 情報を求めている対象（何について知りたいのか）
    /// 複数ある場合はカンマ区切り。ない場合はnull。
    /// </summary>
    public string? InformationTopic { get; set; }

    /// <summary>
    /// 対象者の視点スコア（0-100）
    /// 0に近いほど「自分のこと」、100に近いほど「他人/チームのこと」
    /// </summary>
    public int OthersFocusScore { get; set; }

    /// <summary>
    /// 対象者の種類
    /// </summary>
    public TargetSubject TargetSubject { get; set; } = TargetSubject.Self;

    /// <summary>
    /// 検出された主な感情カテゴリ
    /// </summary>
    public string PrimaryEmotion { get; set; } = string.Empty;

    /// <summary>
    /// 分析の信頼度 (0-100)
    /// </summary>
    public int Confidence { get; set; }

    /// <summary>
    /// 分析の簡単な説明（30文字以内）
    /// </summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>
    /// 困っているかどうか（TroubledScore >= 50）
    /// </summary>
    public bool IsTroubled => TroubledScore >= 50;

    /// <summary>
    /// ネガティブな感情かどうか（NegativeScore >= 50）
    /// </summary>
    public bool IsNegative => NegativeScore >= 50;

    /// <summary>
    /// ポジティブな感情かどうか（PositiveScore >= 50）
    /// </summary>
    public bool IsPositive => PositiveScore >= 50;

    /// <summary>
    /// 緊急性が高いかどうか（UrgencyScore >= 50）
    /// </summary>
    public bool IsUrgent => UrgencyScore >= 50;

    /// <summary>
    /// 指示・ガイダンスを求めているかどうか（GuidanceSeekingScore >= 50）
    /// </summary>
    public bool IsSeekingGuidance => GuidanceSeekingScore >= 50;

    /// <summary>
    /// 情報・知識を求めているかどうか（InformationSeekingScore >= 50）
    /// </summary>
    public bool IsSeekingInformation => InformationSeekingScore >= 50;

    /// <summary>
    /// 他者/チームのことを気にしているかどうか（OthersFocusScore >= 50）
    /// </summary>
    public bool IsFocusingOnOthers => OthersFocusScore >= 50;

    /// <summary>
    /// 注意が必要かどうか（困っている or ネガティブ or 緊急）
    /// </summary>
    public bool NeedsAttention => IsTroubled || IsNegative || IsUrgent;
}

/// <summary>
/// メッセージが誰について言及しているか
/// </summary>
public enum TargetSubject
{
    /// <summary>自分自身</summary>
    Self,

    /// <summary>特定の他者</summary>
    SpecificOther,

    /// <summary>チーム/組織全体</summary>
    Team,

    /// <summary>不明/一般的</summary>
    General
}