using Pecus.Libs.AI.Models;

namespace Pecus.Libs.AI;

/// <summary>
/// 会話の文脈から発言の宛先を判定するサービスのインターフェース
/// </summary>
public interface IConversationTargetAnalyzer
{
    /// <summary>
    /// 会話履歴から最後のユーザーメッセージがどのボットに向けられているかを判定する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="conversationHistory">会話履歴（時系列順）</param>
    /// <param name="lastUserMessage">判定対象の最後のユーザーメッセージ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>宛先判定結果（必ず1つのターゲットを返す）</returns>
    Task<ConversationTargetResult> AnalyzeTargetAsync(
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string lastUserMessage,
        CancellationToken cancellationToken = default);
}
