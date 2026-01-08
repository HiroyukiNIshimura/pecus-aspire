using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI;

/// <summary>
/// グループチャットでBotが返信すべきかを判定するサービスのインターフェース
/// </summary>
public interface IShouldReplyAnalyzer
{
    /// <summary>
    /// 会話の文脈から、指定されたBotが返信すべきかを判定する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="conversationHistory">会話履歴（時系列順）</param>
    /// <param name="triggerMessage">トリガーとなったメッセージ</param>
    /// <param name="availableBots">利用可能なBot情報のリスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>返信判定結果（どのBotが返信すべきか、または誰も返信不要か）</returns>
    Task<GroupChatReplyDecision> AnalyzeAsync(
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string triggerMessage,
        IReadOnlyList<BotInfo> availableBots,
        CancellationToken cancellationToken = default);
}