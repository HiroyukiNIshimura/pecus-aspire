using Pecus.Libs.AI;
using Pecus.Libs.AI.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Utils;

/// <summary>
/// Bot選択に関する処理を提供するサービスのインターフェース
/// Botはグローバル（全組織共通）なので、BotTypeで取得する
/// 組織固有のChatActorを取得する場合はorganizationIdを指定する
/// </summary>
public interface IBotSelector
{
    /// <summary>
    /// 感情分析結果に基づいてBotTypeを決定する
    /// </summary>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="contentForAnalysis">分析対象のコンテンツ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>決定されたBotType</returns>
    Task<BotType> DetermineBotTypeByContentAsync(
        IAiClient aiClient,
        string contentForAnalysis,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 会話履歴から最後のユーザーメッセージがどのボットに向けられているかを判定してBotを取得する
    /// </summary>
    /// <param name="organizationId">組織ID（ChatActor取得用）</param>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="conversationHistory">会話履歴（時系列順）</param>
    /// <param name="lastUserMessage">判定対象の最後のユーザーメッセージ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>選択されたBot（ChatActorを含む）、見つからない場合はnull</returns>
    Task<DB.Models.Bot?> SelectBotByConversationAsync(
        int organizationId,
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string lastUserMessage,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 指定されたタイプのBotを取得する（グローバル）
    /// </summary>
    /// <param name="botType">取得するBotの種類</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>Bot、見つからない場合はnull</returns>
    Task<DB.Models.Bot?> GetBotAsync(
        BotType botType,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 指定されたタイプのBotを組織のChatActorと共に取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="botType">取得するBotの種類</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>Bot（組織のChatActorを含む）、見つからない場合はnull</returns>
    Task<DB.Models.Bot?> GetBotWithChatActorAsync(
        int organizationId,
        BotType botType,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 感情分析を行い、適切なBotを組織のChatActorと共に取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="contentForAnalysis">分析対象のコンテンツ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>選択されたBot（組織のChatActorを含む）、見つからない場合はnull</returns>
    Task<DB.Models.Bot?> SelectBotByContentAsync(
        int organizationId,
        IAiClient aiClient,
        string contentForAnalysis,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Botからランダムに1つ選択して組織のChatActorと共に取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>ランダムに選択されたBot（組織のChatActorを含む）、Botが存在しない場合はnull</returns>
    Task<DB.Models.Bot?> GetRandomBotAsync(
        int organizationId,
        CancellationToken cancellationToken = default);

}