using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Models;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Utils;

/// <summary>
/// Bot選択に関する処理を提供するサービス
/// Botはグローバル（全組織共通）なので、BotTypeで取得する
/// 組織固有のChatActorを取得する場合はorganizationIdを指定する
/// </summary>
public class BotSelector : IBotSelector
{
    private readonly ApplicationDbContext _context;
    private readonly IMessageAnalyzer _messageAnalyzer;
    private readonly IConversationTargetAnalyzer _conversationTargetAnalyzer;
    private readonly ILogger<BotSelector> _logger;

    /// <summary>
    /// BotSelector のコンストラクタ
    /// </summary>
    public BotSelector(
        ApplicationDbContext context,
        IMessageAnalyzer messageAnalyzer,
        IConversationTargetAnalyzer conversationTargetAnalyzer,
        ILogger<BotSelector> logger)
    {
        _context = context;
        _messageAnalyzer = messageAnalyzer;
        _conversationTargetAnalyzer = conversationTargetAnalyzer;
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

        // 注意が必要な場合（困っている、緊急、ネガティブ）は ChatBot（親しみやすいサポート）
        // 通常の業務報告は SystemBot（フォーマルな報告）
        var botType = needsAttention ? BotType.ChatBot : BotType.SystemBot;

        _logger.LogDebug(
            "Bot type determined: NeedsAttention={NeedsAttention}, BotType={BotType}",
            needsAttention,
            botType
        );

        return botType;
    }

    /// <inheritdoc />
    public async Task<DB.Models.Bot?> SelectBotByConversationAsync(
        int organizationId,
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string lastUserMessage,
        CancellationToken cancellationToken = default)
    {
        var targetResult = await _conversationTargetAnalyzer.AnalyzeTargetAsync(
            aiClient,
            conversationHistory,
            lastUserMessage,
            cancellationToken
        );

        if (string.IsNullOrEmpty(targetResult.TargetId))
        {
            _logger.LogDebug(
                "No target bot determined from conversation, selecting random bot: Reasoning={Reasoning}",
                targetResult.Reasoning
            );
            return await GetRandomBotAsync(organizationId, cancellationToken);
        }

        if (!int.TryParse(targetResult.TargetId, out var botActorId))
        {
            _logger.LogWarning(
                "Failed to parse TargetId as int: TargetId={TargetId}",
                targetResult.TargetId
            );
            return null;
        }

        // ChatActorIdからBotを取得（組織フィルタはChatActor側で行う）
        var chatActor = await _context.ChatActors
            .Include(ca => ca.Bot)
            .FirstOrDefaultAsync(ca =>
                ca.Id == botActorId &&
                ca.OrganizationId == organizationId &&
                ca.BotId != null,
                cancellationToken);

        if (chatActor?.Bot == null)
        {
            _logger.LogDebug(
                "Bot not found by ChatActorId: OrganizationId={OrganizationId}, ChatActorId={ChatActorId}",
                organizationId,
                botActorId
            );
            return null;
        }

        // Botに組織のChatActorをセット
        chatActor.Bot.ChatActors = new List<DB.Models.ChatActor> { chatActor };

        _logger.LogDebug(
            "Bot selected by conversation: BotId={BotId}, BotName={BotName}, Confidence={Confidence}, Reasoning={Reasoning}",
            chatActor.Bot.Id,
            chatActor.Bot.Name,
            targetResult.Confidence,
            targetResult.Reasoning
        );

        return chatActor.Bot;
    }

    /// <inheritdoc />
    public async Task<DB.Models.Bot?> GetBotAsync(
        BotType botType,
        CancellationToken cancellationToken = default)
    {
        var bot = await _context.Bots
            .FirstOrDefaultAsync(b => b.Type == botType, cancellationToken);

        if (bot == null)
        {
            _logger.LogDebug("Bot not found: BotType={BotType}", botType);
        }

        return bot;
    }

    /// <inheritdoc />
    public async Task<DB.Models.Bot?> GetBotWithChatActorAsync(
        int organizationId,
        BotType botType,
        CancellationToken cancellationToken = default)
    {
        var bot = await _context.Bots
            .Include(b => b.ChatActors.Where(ca => ca.OrganizationId == organizationId))
            .FirstOrDefaultAsync(b => b.Type == botType, cancellationToken);

        if (bot == null)
        {
            _logger.LogDebug(
                "Bot not found: BotType={BotType}",
                botType
            );
            return null;
        }

        if (bot.ChatActors.Count == 0)
        {
            _logger.LogDebug(
                "ChatActor not found for Bot: OrganizationId={OrganizationId}, BotType={BotType}",
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

        return await GetBotWithChatActorAsync(organizationId, botType, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<DB.Models.Bot?> GetRandomBotAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        var bots = await _context.Bots
            .Include(b => b.ChatActors.Where(ca => ca.OrganizationId == organizationId))
            .Where(b => b.Type != BotType.WildBot) // WildBotはランダム選択から除外
            .ToListAsync(cancellationToken);

        if (bots.Count == 0)
        {
            _logger.LogDebug("No bots found");
            return null;
        }

        var randomIndex = Random.Shared.Next(bots.Count);
        var selectedBot = bots[randomIndex];

        _logger.LogDebug(
            "Random bot selected: BotId={BotId}, BotType={BotType}",
            selectedBot.Id,
            selectedBot.Type
        );

        return selectedBot;
    }
}