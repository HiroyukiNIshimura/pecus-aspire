using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;

/// <summary>
/// 通常のチャット返信を行う振る舞い
/// </summary>
public class NormalReplyBehavior : IBotBehavior
{
    private const int MaxConversationTurns = 5;
    private readonly ILogger<NormalReplyBehavior> _logger;

    /// <summary>
    /// NormalReplyBehavior のコンストラクタ
    /// </summary>
    public NormalReplyBehavior(ILogger<NormalReplyBehavior> logger)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public string Name => "NormalReply";

    /// <summary>
    /// Weight 配分
    /// ※ WorkspaceHealth と OrganizationHealth は GroupChatScope により排他
    /// </summary>
    public int Weight => 50;

    /// <inheritdoc />
    public Task<bool> CanExecuteAsync(BotBehaviorContext context)
    {
        return Task.FromResult(context.AiClient != null);
    }

    /// <inheritdoc />
    public async Task<string?> ExecuteAsync(BotBehaviorContext context)
    {
        if (context.AiClient == null)
        {
            return null;
        }

        var recent = await context.GetRecentMessagesAsync(
            context.Room.Id,
            MaxConversationTurns,
            context.TriggerMessage.Id
        );

        var messages = new List<(MessageRole Role, string Content)>();

        foreach (var msg in recent)
        {
            var role = msg.IsBot ? MessageRole.Assistant : MessageRole.User;
            var content = msg.IsBot ? msg.Content : $"({msg.UserName}さん曰く): {msg.Content}";
            messages.Add((role, content ?? string.Empty));
        }
        messages.Insert(0, (MessageRole.System, "Userを示す二人称は、文章内を参照します。"));

        var systemPrompt = new SystemPromptBuilder()
            .WithRawPersona(context.Bot.Persona)
            .WithRawConstraint(context.Bot.Constraint)
            .Build();

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
                "AI generation failed in NormalReplyBehavior: OrganizationId={OrganizationId}, RoomId={RoomId}",
                context.OrganizationId,
                context.Room.Id
            );
            return "申し訳ありませんが、一時的なエラーが発生しました。";
        }
    }
}
