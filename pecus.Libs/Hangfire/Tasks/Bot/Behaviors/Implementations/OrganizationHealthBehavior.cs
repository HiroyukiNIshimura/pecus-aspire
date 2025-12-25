using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;

/// <summary>
/// 組織の健康状態についてコメントする振る舞い
/// </summary>
public class OrganizationHealthBehavior : IBotBehavior
{
    private readonly IHealthDataProvider _healthDataProvider;
    private readonly ILogger<OrganizationHealthBehavior> _logger;

    /// <summary>
    /// OrganizationHealthBehavior のコンストラクタ
    /// </summary>
    public OrganizationHealthBehavior(
        IHealthDataProvider healthDataProvider,
        ILogger<OrganizationHealthBehavior> logger)
    {
        _healthDataProvider = healthDataProvider;
        _logger = logger;
    }

    /// <inheritdoc />
    public string Name => "OrganizationHealth";

    /// <summary>
    /// Weight 配分（全 Behavior の合計: 85）:
    /// - Silent: 40 → 47.1%
    /// - NormalReply: 30 → 35.3%
    /// - WorkspaceHealth/OrganizationHealth: 15 → 17.6%
    /// ※ GroupChatScope == Organization の場合のみ適用（WorkspaceHealth と排他）
    /// </summary>
    public int Weight => 1500;

    /// <inheritdoc />
    public Task<bool> CanExecuteAsync(BotBehaviorContext context)
    {
        return Task.FromResult(!context.IsWorkspaceScope && context.AiClient != null);
    }

    /// <inheritdoc />
    public async Task<string?> ExecuteAsync(BotBehaviorContext context)
    {
        if (context.AiClient == null)
        {
            return null;
        }

        var healthData = await _healthDataProvider.GetOrganizationHealthDataAsync(context.OrganizationId);

        _logger.LogInformation(
            "OrganizationHealthBehavior healthData: OrganizationId={OrganizationId}, Summary={Summary}",
            context.OrganizationId,
            healthData.ToSummary()
        );

        var systemPrompt = $"""
            あなたはチャットに参加しているボットです。
            会話の流れとは無関係に、ふと思い立って組織全体のタスク状況について呟きます。
            質問に答えるのではなく、独り言のように自然に発言してください。

            【参照データ】以下のタスク統計データに基づいて呟いてください:
            {healthData.ToSummary()}

            【呟きルール】
            - 上記データの具体的な数字（完了率、タスク数、期限切れ数、メンバー数など）を必ず1つ以上言及
            - 「〜だね」「〜かな」「〜やん」など独り言っぽい語尾
            - 2-3文で簡潔に
            - 質問形式にしない（「どう思う？」などで終わらない）
            - 相手のメッセージに対する返事ではない
            - 物理的なオフィスや机の話はしない

            【口調】
            {context.Bot.Persona ?? "フレンドリーな口調で"}
            """;

        var messages = new List<(MessageRole Role, string Content)>
        {
            (MessageRole.User, "組織のタスク状況について呟いて")
        };

        try
        {
            var responseText = await context.AiClient.GenerateTextWithMessagesAsync(
                messages,
                systemPrompt
            );

            return responseText ?? "...";
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "OrganizationHealthBehavior execution failed: OrganizationId={OrganizationId}",
                context.OrganizationId
            );
            return null;
        }
    }
}
