namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;

/// <summary>
/// 何も返信しない振る舞い（沈黙）
/// </summary>
public class SilentBehavior : IBotBehavior
{
    /// <inheritdoc />
    public string Name => "Silent";

    /// <inheritdoc />
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
