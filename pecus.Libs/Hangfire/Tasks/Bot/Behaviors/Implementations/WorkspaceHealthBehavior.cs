using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;

/// <summary>
/// ワークスペースの健康状態についてコメントする振る舞い
/// </summary>
public class WorkspaceHealthBehavior : IBotBehavior
{
    private static readonly string[] Perspectives =
    [
        "完了率に注目して",
        "期限切れタスクに注目して",
        "進行中タスクの数に注目して",
        "今週の進捗に注目して",
        "残りタスク数に注目して"
    ];

    private readonly IHealthDataProvider _healthDataProvider;
    private readonly IPerspectiveRotator _perspectiveRotator;
    private readonly ILogger<WorkspaceHealthBehavior> _logger;

    /// <summary>
    /// WorkspaceHealthBehavior のコンストラクタ
    /// </summary>
    public WorkspaceHealthBehavior(
        IHealthDataProvider healthDataProvider,
        IPerspectiveRotator perspectiveRotator,
        ILogger<WorkspaceHealthBehavior> logger)
    {
        _healthDataProvider = healthDataProvider;
        _perspectiveRotator = perspectiveRotator;
        _logger = logger;
    }

    /// <inheritdoc />
    public string Name => "WorkspaceHealth";

    /// <summary>
    /// Weight 配分
    /// ※ WorkspaceHealth と OrganizationHealth は GroupChatScope により排他
    /// </summary>
    public int Weight => 20;

    /// <inheritdoc />
    public Task<bool> CanExecuteAsync(BotBehaviorContext context)
    {
        return Task.FromResult(context.IsWorkspaceScope && context.AiClient != null);
    }

    /// <inheritdoc />
    public async Task<string?> ExecuteAsync(BotBehaviorContext context)
    {
        if (context.AiClient == null || context.WorkspaceId == null)
        {
            return null;
        }

        var healthData = await _healthDataProvider.GetWorkspaceHealthDataAsync(context.WorkspaceId.Value);
        var perspective = _perspectiveRotator.GetNext(Name, context.WorkspaceId.Value, Perspectives);

        var systemPrompt = $"""
            あなたはチャットに参加しているボットです。
            会話の流れとは無関係に、ふと思い立ってワークスペースのタスク状況について呟きます。
            質問に答えるのではなく、独り言のように自然に発言してください。

            【参照データ】以下のタスク統計データに基づいて呟いてください:
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
            (MessageRole.User, $"ワークスペースのタスク状況について、{perspective}呟いて")
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
                "WorkspaceHealthBehavior execution failed: WorkspaceId={WorkspaceId}",
                context.WorkspaceId
            );
            return null;
        }
    }
}