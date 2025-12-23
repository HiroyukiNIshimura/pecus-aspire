using Pecus.Libs.AI;
using Pecus.Libs.AI.Models;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// Bot選択に関する処理を提供するサービスのインターフェース
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
    /// <param name="organizationId">組織ID</param>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="conversationHistory">会話履歴（時系列順）</param>
    /// <param name="lastUserMessage">判定対象の最後のユーザーメッセージ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>選択されたBot、見つからない場合はnull</returns>
    Task<DB.Models.Bot?> SelectBotByConversationAsync(
        int organizationId,
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string lastUserMessage,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 組織の指定されたタイプのBotを取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="botType">取得するBotの種類</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>Bot、見つからない場合はnull</returns>
    Task<DB.Models.Bot?> GetBotAsync(
        int organizationId,
        BotType botType,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 感情分析を行い、適切なBotを選択して取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="aiClient">AIクライアント</param>
    /// <param name="contentForAnalysis">分析対象のコンテンツ</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>選択されたBot、見つからない場合はnull</returns>
    Task<DB.Models.Bot?> SelectBotByContentAsync(
        int organizationId,
        IAiClient aiClient,
        string contentForAnalysis,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 組織のBotからランダムに1つ選択して取得する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>ランダムに選択されたBot、Botが存在しない場合はnull</returns>
    Task<DB.Models.Bot?> GetRandomBotAsync(
        int organizationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Bot起動抽選を行う
    /// </summary>
    /// <param name="probability">確度（0-100 の整数、100 で必ず起動）</param>
    /// <returns>抽選結果（true: 起動する、false: 起動しない）</returns>
    bool ShouldActivate(int probability);
}
