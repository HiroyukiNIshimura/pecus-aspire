using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// Bot選択に関する処理を提供するサービス
/// </summary>
public class BotSelector : IBotSelector
{
    private readonly ApplicationDbContext _context;
    private readonly IMessageAnalyzer _messageAnalyzer;
    private readonly ILogger<BotSelector> _logger;

    /// <summary>
    /// BotSelector のコンストラクタ
    /// </summary>
    public BotSelector(
        ApplicationDbContext context,
        IMessageAnalyzer messageAnalyzer,
        ILogger<BotSelector> logger)
    {
        _context = context;
        _messageAnalyzer = messageAnalyzer;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<BotType> DetermineBotTypeByContentAsync(
        IAiClient aiClient,
        string contentForAnalysis,
        CancellationToken cancellationToken = default)
    {
        var needsAttention = await _messageAnalyzer.NeedsAttentionAsync(
            aiClient,
            contentForAnalysis,
            cancellationToken
        );

        var botType = needsAttention ? BotType.SystemBot : BotType.ChatBot;

        _logger.LogDebug(
            "Bot type determined: NeedsAttention={NeedsAttention}, BotType={BotType}",
            needsAttention,
            botType
        );

        return botType;
    }

    /// <inheritdoc />
    public async Task<DB.Models.Bot?> GetBotAsync(
        int organizationId,
        BotType botType,
        CancellationToken cancellationToken = default)
    {
        var bot = await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == botType,
                cancellationToken);

        if (bot == null)
        {
            _logger.LogDebug(
                "Bot not found: OrganizationId={OrganizationId}, BotType={BotType}",
                organizationId,
                botType
            );
        }

        return bot;
    }

    /// <inheritdoc />
    public async Task<DB.Models.Bot?> SelectBotByContentAsync(
        int organizationId,
        IAiClient aiClient,
        string contentForAnalysis,
        CancellationToken cancellationToken = default)
    {
        var botType = await DetermineBotTypeByContentAsync(
            aiClient,
            contentForAnalysis,
            cancellationToken
        );

        return await GetBotAsync(organizationId, botType, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<DB.Models.Bot?> GetRandomBotAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        var bots = await _context.Bots
            .Include(b => b.ChatActor)
            .Where(b => b.OrganizationId == organizationId)
            .ToListAsync(cancellationToken);

        if (bots.Count == 0)
        {
            _logger.LogDebug(
                "No bots found for organization: OrganizationId={OrganizationId}",
                organizationId
            );
            return null;
        }

        var randomIndex = Random.Shared.Next(bots.Count);
        var selectedBot = bots[randomIndex];

        _logger.LogDebug(
            "Random bot selected: OrganizationId={OrganizationId}, BotId={BotId}, BotType={BotType}",
            organizationId,
            selectedBot.Id,
            selectedBot.Type
        );

        return selectedBot;
    }

    /// <inheritdoc />
    public bool ShouldActivate(int probability)
    {
        return BotTaskUtils.ShouldActivateBot(probability);
    }
}
