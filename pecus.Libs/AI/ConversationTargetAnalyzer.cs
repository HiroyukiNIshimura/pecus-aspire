using Microsoft.Extensions.Logging;
using Pecus.Libs.AI.Models;
using System.Text;

namespace Pecus.Libs.AI;

/// <summary>
/// 会話の文脈から発言の宛先を判定するサービス
/// </summary>
public class ConversationTargetAnalyzer : IConversationTargetAnalyzer
{
    private readonly ILogger<ConversationTargetAnalyzer> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="logger">ロガー</param>
    public ConversationTargetAnalyzer(ILogger<ConversationTargetAnalyzer> logger)
    {
        _logger = logger;
    }

    private const string AnalysisSystemPrompt = """
        あなたは会話分析の専門家です。
        複数のボットとユーザーが参加するチャット会話を分析し、
        最後のユーザーメッセージがどのボットに向けられているかを判定してください。

        判定のポイント:
        - 直前のボットの発言内容に対する返答かどうか
        - 話題やキーワードの関連性
        - 会話の流れ・文脈
        - 指示語や呼びかけの有無
        - 質問に対する回答の関連性

        【重要な制約】
        - 必ずボット一覧から1つを選んでください
        - 判定できない場合でも、最も可能性が高いものを選んでください
        - 回答しないという選択肢はありません

        以下のJSON形式で必ず回答してください:
        {
            "targetId": "選択したボットのID",
            "targetName": "選択したボットの名前",
            "confidence": 判定の確信度（0-100の数値）,
            "reasoning": "判定の根拠（50文字以内）"
        }
        """;

    /// <inheritdoc />
    public async Task<ConversationTargetResult> AnalyzeTargetAsync(
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string lastUserMessage,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(lastUserMessage))
        {
            _logger.LogDebug("Empty last user message provided");
            return CreateFallbackResult(conversationHistory);
        }

        var bots = conversationHistory
            .Where(m => m.IsBot)
            .Select(m => new { m.SenderId, m.SenderName })
            .DistinctBy(b => b.SenderId)
            .ToList();

        if (bots.Count == 0)
        {
            _logger.LogDebug("No bots found in conversation history");
            return new ConversationTargetResult
            {
                Confidence = 0,
                Reasoning = "会話履歴にボットが存在しません",
            };
        }

        if (bots.Count == 1)
        {
            _logger.LogDebug("Only one bot in conversation, returning that bot");
            return new ConversationTargetResult
            {
                TargetId = bots[0].SenderId,
                TargetName = bots[0].SenderName,
                Confidence = 100,
                Reasoning = "会話参加ボットが1人のため",
            };
        }

        try
        {
            var userPrompt = BuildUserPrompt(conversationHistory, lastUserMessage, bots);

            var result = await aiClient.GenerateJsonAsync<ConversationTargetResult>(
                AnalysisSystemPrompt,
                userPrompt,
                cancellationToken: cancellationToken
            );

            if (string.IsNullOrEmpty(result.TargetId))
            {
                _logger.LogWarning("AI returned empty target, using fallback");
                return CreateFallbackResult(conversationHistory);
            }

            _logger.LogDebug(
                "Conversation target analysis completed: TargetId={TargetId}, TargetName={TargetName}, Confidence={Confidence}",
                result.TargetId,
                result.TargetName,
                result.Confidence
            );

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Conversation target analysis failed, using fallback");
            return CreateFallbackResult(conversationHistory);
        }
    }

    private static string BuildUserPrompt(
        IReadOnlyList<ConversationMessage> history,
        string lastUserMessage,
        IEnumerable<dynamic> bots)
    {
        var sb = new StringBuilder();

        sb.AppendLine("【ボット一覧】");
        foreach (var bot in bots)
        {
            sb.AppendLine($"- ID: {bot.SenderId}, 名前: {bot.SenderName}");
        }
        sb.AppendLine();

        sb.AppendLine("【会話履歴】");
        foreach (var msg in history)
        {
            var role = msg.IsBot ? "[ボット]" : "[ユーザー]";
            sb.AppendLine($"{role} {msg.SenderName}: {msg.Content}");
        }
        sb.AppendLine();

        sb.AppendLine("【判定対象のユーザーメッセージ】");
        sb.AppendLine(lastUserMessage);

        return sb.ToString();
    }

    /// <summary>
    /// 判定失敗時のフォールバック結果を作成（直近のボットを返す）
    /// </summary>
    private static ConversationTargetResult CreateFallbackResult(
        IReadOnlyList<ConversationMessage> history)
    {
        var lastBot = history.LastOrDefault(m => m.IsBot);

        if (lastBot == null)
        {
            return new ConversationTargetResult
            {
                Confidence = 0,
                Reasoning = "ボットが見つかりません",
            };
        }

        return new ConversationTargetResult
        {
            TargetId = lastBot.SenderId,
            TargetName = lastBot.SenderName,
            Confidence = 50,
            Reasoning = "直近で発言したボットをフォールバックとして選択",
        };
    }
}
