using Microsoft.Extensions.Logging;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

/// <summary>
/// ボットの振る舞いを重み付きランダムで選択する
/// </summary>
public class BotBehaviorSelector : IBotBehaviorSelector
{
    private readonly IEnumerable<IBotBehavior> _behaviors;
    private readonly ILogger<BotBehaviorSelector> _logger;

    /// <summary>
    /// BotBehaviorSelector のコンストラクタ
    /// </summary>
    public BotBehaviorSelector(
        IEnumerable<IBotBehavior> behaviors,
        ILogger<BotBehaviorSelector> logger)
    {
        _behaviors = behaviors;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IBotBehavior?> SelectBehaviorAsync(BotBehaviorContext context)
    {
        var applicableBehaviors = new List<IBotBehavior>();

        foreach (var behavior in _behaviors)
        {
            if (await behavior.CanExecuteAsync(context))
            {
                applicableBehaviors.Add(behavior);
                _logger.LogDebug(
                    "Behavior '{BehaviorName}' is applicable with weight {Weight}",
                    behavior.Name,
                    behavior.Weight
                );
            }
        }

        if (applicableBehaviors.Count == 0)
        {
            _logger.LogDebug("No applicable behaviors found");
            return null;
        }

        var selected = SelectByWeight(applicableBehaviors);

        if (selected != null)
        {
            _logger.LogInformation(
                "Selected behavior '{BehaviorName}' from {Count} applicable behaviors",
                selected.Name,
                applicableBehaviors.Count
            );
        }

        return selected;
    }

    private static IBotBehavior? SelectByWeight(List<IBotBehavior> behaviors)
    {
        var totalWeight = behaviors.Sum(b => b.Weight);
        if (totalWeight <= 0)
        {
            return null;
        }

        var randomValue = Random.Shared.Next(totalWeight);
        var cumulativeWeight = 0;

        foreach (var behavior in behaviors)
        {
            cumulativeWeight += behavior.Weight;
            if (randomValue < cumulativeWeight)
            {
                return behavior;
            }
        }

        return behaviors.LastOrDefault();
    }
}