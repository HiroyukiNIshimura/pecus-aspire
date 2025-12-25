using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;

/// <summary>
/// ワークスペースの健康状態についてコメントする振る舞い
/// </summary>
public class WorkspaceHealthBehavior : IBotBehavior
{
    private readonly IHealthDataProvider _healthDataProvider;
    private readonly ILogger<WorkspaceHealthBehavior> _logger;

    /// <summary>
    /// WorkspaceHealthBehavior のコンストラクタ
    /// </summary>
    public WorkspaceHealthBehavior(
        IHealthDataProvider healthDataProvider,
        ILogger<WorkspaceHealthBehavior> logger)
    {
        _healthDataProvider = healthDataProvider;
        _logger = logger;
    }

    /// <inheritdoc />
    public string Name => "WorkspaceHealth";

    /// <inheritdoc />
    public int Weight => 15;

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

        var systemPrompt = new SystemPromptBuilder()
            .WithRawPersona(context.Bot.Persona)
            .WithRawConstraint(context.Bot.Constraint)
            .AddConstraint($"以下のワークスペースの健康状態データに基づいてコメントしてください:\n{healthData.ToSummary()}")
            .AddConstraint("ポジティブな状況ならば励まし、改善が必要ならば優しくアドバイスしてください")
            .AddConstraint("データの数値をそのまま列挙するのではなく、自然な会話として伝えてください")
            .AddConstraint("返答は2-3文で簡潔に")
            .Build();

        var messages = new List<(MessageRole Role, string Content)>
        {
            (MessageRole.User, "このワークスペースの状態について一言お願いします")
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
