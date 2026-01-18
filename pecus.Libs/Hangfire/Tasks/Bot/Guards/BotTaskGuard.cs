using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

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
    public async Task<(bool, AISignature?)> IsBotEnabledAsync(int organizationId)
    {
        var setting = await _context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

        if (setting?.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting?.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting?.GenerativeApiModel))
        {
            _logger.LogWarning(
                    "GenerativeApiVendor is not configured or required fields are missing: OrganizationId={OrganizationId}, Setting={Setting}, Vendor={Vendor}",
                    organizationId,
                    setting != null ? "exists" : "null",
                    setting?.GenerativeApiVendor
                );
            return (false, null);
        }

        return (true, new AISignature(
            setting.GenerativeApiVendor,
            setting.GenerativeApiModel,
            setting.GenerativeApiKey,
            setting.BotGroupChatMessagesEnabled
            ));
    }
}
