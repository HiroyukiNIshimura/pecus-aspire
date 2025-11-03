using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// リフレッシュトークンのクリーンアップタスク
/// </summary>
public class RefreshTokenCleanupTasks
{
    private readonly ILogger<RefreshTokenCleanupTasks> _logger;
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="logger"></param>
    /// <param name="context"></param>
    public RefreshTokenCleanupTasks(ILogger<RefreshTokenCleanupTasks> logger, ApplicationDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// 期限切れ・無効化済みのリフレッシュトークンをバッチで削除します。
    /// - ExpiresAt が現在時刻より過去のもの
    /// - または IsRevoked==true で保持期間(olderThanDays)を超えたもの
    /// </summary>
    /// <param name="batchSize">一度に削除する件数</param>
    /// <param name="olderThanDays">無効化後に残す日数（この日数より古いものを削除）</param>
    /// <returns></returns>
    public async Task CleanupExpiredTokensAsync(int batchSize = 1000, int olderThanDays = 30)
    {
        _logger.LogInformation("RefreshToken cleanup started. batchSize={BatchSize} olderThanDays={OlderThanDays}", batchSize, olderThanDays);

        var cutoff = DateTime.UtcNow.AddDays(-olderThanDays);
        var totalDeleted = 0;

        while (true)
        {
            // 削除対象: 有効期限切れ OR 無効化済みで古いもの
            var items = await _context.RefreshTokens
                .Where(t => t.ExpiresAt <= DateTime.UtcNow || (t.IsRevoked && t.CreatedAt <= cutoff))
                .OrderBy(t => t.CreatedAt)
                .Take(batchSize)
                .ToListAsync();

            if (!items.Any()) break;

            _context.RefreshTokens.RemoveRange(items);
            await _context.SaveChangesAsync();

            totalDeleted += items.Count;
            _logger.LogInformation("Deleted {Count} refresh token records in this batch", items.Count);

            // 少し待つことでDB負荷を抑える（必要なら調整）
            await Task.Delay(200);
        }

        _logger.LogInformation("RefreshToken cleanup completed. totalDeleted={Total}", totalDeleted);
    }
}
