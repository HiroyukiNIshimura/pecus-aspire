using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Guards;

/// <summary>
/// Bot タスク実行前の共通チェックを提供するサービス
/// </summary>
public class BotTaskGuard : IBotTaskGuard
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BotTaskGuard> _logger;

    /// <summary>
    /// BotTaskGuard のコンストラクタ
    /// </summary>
    public BotTaskGuard(ApplicationDbContext context, ILogger<BotTaskGuard> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<bool> IsGroupChatEnabledAsync(int organizationId)
    {
        var setting = await _context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

        if (setting?.BotGroupChatMessagesEnabled == false)
        {
            _logger.LogDebug(
                "BotGroupChatMessagesEnabled is disabled: OrganizationId={OrganizationId}",
                organizationId);
            return false;
        }

        return true;
    }
}
