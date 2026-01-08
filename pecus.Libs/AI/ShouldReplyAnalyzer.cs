using Microsoft.Extensions.Logging;
using Pecus.Libs.AI.Models;
using System.Text;

namespace Pecus.Libs.AI;

/// <summary>
/// グループチャットでBotが返信すべきかをAIで判定するサービス
/// </summary>
public class ShouldReplyAnalyzer : IShouldReplyAnalyzer
{
    private readonly ILogger<ShouldReplyAnalyzer> _logger;

    /// <summary>
    /// ShouldReplyAnalyzer のコンストラクタ
    /// </summary>
    public ShouldReplyAnalyzer(ILogger<ShouldReplyAnalyzer> logger)
    {
        _logger = logger;
    }

    private const string AnalysisSystemPrompt = """
        あなたはグループチャットの会話分析の専門家です。
        複数のユーザーとボットが参加するグループチャットで、
        最新のメッセージに対してボットが返信すべきかを判定してください。

        【返信すべき場合と担当ボット】
        - ボットに直接呼びかけている（名前を呼んでいる、@メンションなど） → そのボット
        - 直前のボットの発言に対する返答・反応である → そのボット
        - 質問や依頼が含まれている → 内容に適したボット
        - 困っている・助けを求めている → ChatBot（親しみやすいサポート担当）
        - 業務報告・フォーマルな内容 → SystemBot（公式アナウンス担当）

        【返信すべきでない場合】
        - ユーザー同士の会話（ボットへの呼びかけがない）
        - すでに回答済みの内容への相槌
        - 単なる「了解」「OK」「ありがとう」などの相槌のみ
        - 挨拶のみで質問や会話の継続がない
        - 他のユーザーへの返答

        【重要な制約】
        - shouldAnyoneReplyがtrueの場合は、必ずresponderBotActorIdとresponderBotNameを設定してください
        - shouldAnyoneReplyがfalseの場合は、responderBotActorIdとresponderBotNameはnullにしてください
        - responderBotActorIdは数値で返してください

        以下のJSON形式で回答してください:

        返信すべき場合:
        {
            "shouldAnyoneReply": true,
            "responderBotActorId": 123,
            "responderBotName": "選択したボット名",
            "confidence": 85,
            "reasoning": "判定理由（50文字以内）"
        }

        返信不要な場合:
        {
            "shouldAnyoneReply": false,
            "responderBotActorId": null,
            "responderBotName": null,
            "confidence": 90,
            "reasoning": "ユーザー同士の会話のため"
        }
        """;

    /// <inheritdoc />
    public async Task<GroupChatReplyDecision> AnalyzeAsync(
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string triggerMessage,
        IReadOnlyList<BotInfo> availableBots,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(triggerMessage))
        {
            _logger.LogDebug("Empty trigger message, skipping reply");
            return GroupChatReplyDecision.NoReply("空のメッセージ");
        }

        if (availableBots.Count == 0)
        {
            _logger.LogDebug("No available bots, skipping reply");
            return GroupChatReplyDecision.NoReply("利用可能なBotがない");
        }

        if (availableBots.Count == 1)
        {
            var onlyBot = availableBots[0];
            _logger.LogDebug(
                "Only one bot available, checking if reply is needed: BotName={BotName}",
                onlyBot.Name
            );

            var singleBotResult = await AnalyzeSingleBotAsync(
                aiClient,
                conversationHistory,
                triggerMessage,
                onlyBot,
                cancellationToken
            );

            return singleBotResult;
        }

        try
        {
            var userPrompt = BuildUserPrompt(conversationHistory, triggerMessage, availableBots);

            var result = await aiClient.GenerateJsonAsync<GroupChatReplyDecision>(
                AnalysisSystemPrompt,
                userPrompt,
                cancellationToken: cancellationToken
            );

            _logger.LogDebug(
                "Group chat reply decision: ShouldReply={ShouldReply}, ResponderBot={ResponderBot}, Confidence={Confidence}, Reasoning={Reasoning}",
                result.ShouldAnyoneReply,
                result.ResponderBotName,
                result.Confidence,
                result.Reasoning
            );

            if (result.ShouldAnyoneReply && result.ResponderBotActorId == null)
            {
                _logger.LogWarning("AI returned shouldAnyoneReply=true but no responder bot, using fallback");
                var fallbackBot = availableBots[0];
                return GroupChatReplyDecision.Reply(
                    fallbackBot.ChatActorId,
                    fallbackBot.Name,
                    "フォールバック選択",
                    50
                );
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Group chat reply analysis failed, defaulting to first bot");
            var fallbackBot = availableBots[0];
            return GroupChatReplyDecision.Reply(
                fallbackBot.ChatActorId,
                fallbackBot.Name,
                "分析エラーのためフォールバック",
                30
            );
        }
    }

    /// <summary>
    /// Botが1つしかない場合の返信判定
    /// </summary>
    private async Task<GroupChatReplyDecision> AnalyzeSingleBotAsync(
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string triggerMessage,
        BotInfo bot,
        CancellationToken cancellationToken)
    {
        const string singleBotPrompt = """
            あなたはグループチャットの会話分析の専門家です。
            最新のメッセージに対して、ボットが返信すべきかを判定してください。

            【返信すべき場合】
            - ボットに直接呼びかけている（名前を呼んでいる、@メンションなど）
            - ボットへの質問や依頼が含まれている
            - 直前のボットの発言に対する返答・反応である
            - 会話の流れでボットが応答するのが自然な場合
            - 困っている・助けを求めている

            【返信すべきでない場合】
            - 他のユーザー同士の会話である
            - 独り言や一般的なつぶやきである
            - すでにボットが回答済みの話題である
            - 単なる「了解」「OK」「ありがとう」などの相槌のみ
            - 挨拶のみで質問や会話の継続がない

            以下のJSON形式で回答してください:
            {
                "shouldReply": true,
                "confidence": 85,
                "reasoning": "判定理由（50文字以内）"
            }
            """;

        try
        {
            var userPrompt = BuildSingleBotUserPrompt(conversationHistory, triggerMessage, bot);

            var result = await aiClient.GenerateJsonAsync<SingleBotReplyDecision>(
                singleBotPrompt,
                userPrompt,
                cancellationToken: cancellationToken
            );

            _logger.LogDebug(
                "Single bot reply decision: ShouldReply={ShouldReply}, Confidence={Confidence}, Reasoning={Reasoning}",
                result.ShouldReply,
                result.Confidence,
                result.Reasoning
            );

            if (result.ShouldReply)
            {
                return GroupChatReplyDecision.Reply(
                    bot.ChatActorId,
                    bot.Name,
                    result.Reasoning,
                    result.Confidence
                );
            }

            return GroupChatReplyDecision.NoReply(result.Reasoning, result.Confidence);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Single bot reply analysis failed, defaulting to reply");
            return GroupChatReplyDecision.Reply(
                bot.ChatActorId,
                bot.Name,
                "分析エラーのためフォールバック",
                30
            );
        }
    }

    private static string BuildUserPrompt(
        IReadOnlyList<ConversationMessage> history,
        string triggerMessage,
        IReadOnlyList<BotInfo> bots)
    {
        var sb = new StringBuilder();

        sb.AppendLine("【利用可能なボット】");
        foreach (var bot in bots)
        {
            var role = bot.RoleDescription ?? "チャットボット";
            sb.AppendLine($"- ChatActorId: {bot.ChatActorId}, 名前: {bot.Name}, 役割: {role}");
        }
        sb.AppendLine();

        if (history.Count > 0)
        {
            sb.AppendLine("【会話履歴（直近10件）】");
            foreach (var msg in history.TakeLast(10))
            {
                var role = msg.IsBot ? "[ボット]" : "[ユーザー]";
                sb.AppendLine($"{role} {msg.SenderName}: {msg.Content}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("【判定対象のメッセージ】");
        sb.AppendLine(triggerMessage);

        return sb.ToString();
    }

    private static string BuildSingleBotUserPrompt(
        IReadOnlyList<ConversationMessage> history,
        string triggerMessage,
        BotInfo bot)
    {
        var sb = new StringBuilder();

        sb.AppendLine($"【判定対象のボット】");
        sb.AppendLine($"名前: {bot.Name}, 役割: {bot.RoleDescription ?? "チャットボット"}");
        sb.AppendLine();

        if (history.Count > 0)
        {
            sb.AppendLine("【会話履歴（直近10件）】");
            foreach (var msg in history.TakeLast(10))
            {
                var role = msg.IsBot ? "[ボット]" : "[ユーザー]";
                sb.AppendLine($"{role} {msg.SenderName}: {msg.Content}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("【判定対象のメッセージ】");
        sb.AppendLine(triggerMessage);

        return sb.ToString();
    }

    /// <summary>
    /// 単一Bot用の返信判定結果
    /// </summary>
    private class SingleBotReplyDecision
    {
        /// <summary>
        /// 返信すべきか
        /// </summary>
        [System.Text.Json.Serialization.JsonPropertyName("shouldReply")]
        public bool ShouldReply { get; set; }

        /// <summary>
        /// 確信度
        /// </summary>
        [System.Text.Json.Serialization.JsonPropertyName("confidence")]
        public int Confidence { get; set; }

        /// <summary>
        /// 判定理由
        /// </summary>
        [System.Text.Json.Serialization.JsonPropertyName("reasoning")]
        public string Reasoning { get; set; } = string.Empty;
    }
}