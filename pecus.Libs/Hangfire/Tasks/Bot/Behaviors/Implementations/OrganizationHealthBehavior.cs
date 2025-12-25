using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;

/// <summary>
/// 組織の健康状態についてコメントする振る舞い（スタブ）
/// </summary>
public class OrganizationHealthBehavior : IBotBehavior
{
    private readonly ILogger<OrganizationHealthBehavior> _logger;

    /// <summary>
    /// OrganizationHealthBehavior のコンストラクタ
    /// </summary>
    public OrganizationHealthBehavior(ILogger<OrganizationHealthBehavior> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public string Name => "OrganizationHealth";

    /// <inheritdoc />
    public int Weight => 15;

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

        var healthData = await GetOrganizationHealthDataAsync(context);

        var systemPrompt = new SystemPromptBuilder()
            .WithRawPersona(context.Bot.Persona)
            .WithRawConstraint(context.Bot.Constraint)
            .AddConstraint($"以下の組織の健康状態データに基づいてコメントしてください: {healthData}")
            .AddConstraint("ポジティブな状況ならば励まし、改善が必要ならば優しくアドバイスしてください")
            .AddConstraint("データの数値をそのまま列挙するのではなく、自然な会話として伝えてください")
            .Build();

        var messages = new List<(MessageRole Role, string Content)>
        {
            (MessageRole.User, "この組織の状態について一言お願いします")
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

    /// <summary>
    /// 組織の健康状態データを取得する（スタブ実装）
    /// </summary>
    private Task<string> GetOrganizationHealthDataAsync(BotBehaviorContext context)
    {
        // TODO: 実際の組織健康状態を取得
        // 例: 全体のタスク完了率、アクティブワークスペース数、メンバーのアクティビティなど
        // var workspaceCount = await context.DbContext.Workspaces
        //     .Where(w => w.OrganizationId == context.OrganizationId && !w.IsArchived)
        //     .CountAsync();

        return Task.FromResult("（健康状態データは未実装です）");
    }
}
