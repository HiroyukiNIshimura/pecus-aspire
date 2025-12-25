namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;

/// <summary>
/// 何も返信しない振る舞い（沈黙）
/// </summary>
public class SilentBehavior : IBotBehavior
{
    /// <inheritdoc />
    public string Name => "Silent";

    /// <summary>
    /// Weight 配分（全 Behavior の合計: 85）:
    /// - Silent: 40 → 47.1%
    /// - NormalReply: 30 → 35.3%
    /// - WorkspaceHealth/OrganizationHealth: 15 → 17.6%
    /// ※ WorkspaceHealth と OrganizationHealth は GroupChatScope により排他
    /// </summary>
    public int Weight => 40;

    /// <inheritdoc />
    public Task<bool> CanExecuteAsync(BotBehaviorContext context)
    {
        return Task.FromResult(true);
    }

    /// <inheritdoc />
    public Task<string?> ExecuteAsync(BotBehaviorContext context)
    {
        return Task.FromResult<string?>(null);
    }
}
