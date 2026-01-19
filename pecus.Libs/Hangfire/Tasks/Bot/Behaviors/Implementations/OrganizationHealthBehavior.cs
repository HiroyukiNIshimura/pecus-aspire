using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;

/// <summary>
/// 組織の健康状態についてコメントする振る舞い
/// </summary>
public class OrganizationHealthBehavior : IBotBehavior
{
    private static readonly string[] Perspectives =
    [
        "完了率に注目して",
        "期限切れタスクに注目して",
        "進行中タスクの数に注目して",
        "今週の進捗に注目して",
        "メンバーの貢献度に注目して",
        "ドキュメントの鮮度に注目して",
        "プロジェクトとナレッジのバランスに注目して"
    ];

    private readonly IHealthDataProvider _healthDataProvider;
    private readonly IPerspectiveRotator _perspectiveRotator;
    private readonly ILogger<OrganizationHealthBehavior> _logger;

    /// <summary>
    /// OrganizationHealthBehavior のコンストラクタ
    /// </summary>
    public OrganizationHealthBehavior(
        IHealthDataProvider healthDataProvider,
        IPerspectiveRotator perspectiveRotator,
        ILogger<OrganizationHealthBehavior> logger)
    {
        _healthDataProvider = healthDataProvider;
        _perspectiveRotator = perspectiveRotator;
        _logger = logger;
    }

    /// <inheritdoc />
    public string Name => "OrganizationHealth";

    /// <summary>
    /// Weight 配分
    /// ※ WorkspaceHealth と OrganizationHealth は GroupChatScope により排他
    /// </summary>
    public int Weight => 20;

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
        var perspective = _perspectiveRotator.GetNext(Name, context.OrganizationId, Perspectives);

        var systemPrompt = $"""
            あなたはチャットに参加しているボットです。
            会話の流れとは無関係に、ふと思い立って組織全体の状況について呟きます。
            質問に答えるのではなく、独り言のように自然に発言してください。

            【重要】組織には「プロジェクト管理」と「ドキュメント管理」の両方のワークスペースがあります。
            データにドキュメント統計が含まれている場合は、以下の観点も意識してください：
            - 開発は進んでいるがドキュメントが放置 → 属人化リスク
            - ドキュメント整備ばかりで開発停滞 → 分析麻痺
            - 両方が健全 → 持続可能な開発体制

            【参照データ】以下の統計データに基づいて呟いてください:
            {healthData.ToSummary()}

            【今回の注目ポイント】
            {perspective}

            【呟きルール】
            - 上記の注目ポイントを中心に、データの具体的な数字を必ず1つ以上言及
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
            (MessageRole.User, $"組織の状況について、{perspective}呟いて")
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