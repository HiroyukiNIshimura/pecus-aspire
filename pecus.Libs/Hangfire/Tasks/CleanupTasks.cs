using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// DBレコードのクリーンアップタスク
/// </summary>
public class CleanupTasks
{
    private readonly ILogger<CleanupTasks> _logger;
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="logger"></param>
    /// <param name="context"></param>
    public CleanupTasks(ILogger<CleanupTasks> logger, ApplicationDbContext context)
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

    /// <summary>
    /// 古くなったDeviceレコードをバッチで削除します。
    /// - IsRevoked==true で保持期間(olderThanDays)を超えたもの
    /// - または IsRevoked==false でも非常に古いもの(veryOldDaysを超えたもの)
    /// </summary>
    /// <param name="batchSize">一度に削除する件数</param>
    /// <param name="olderThanDays">無効化後に残す日数（この日数より古いものを削除）</param>
    /// <param name="veryOldDays">有効なデバイスでも削除する古さの日数（デフォルト: 365日）</param>
    /// <returns></returns>
    public async Task CleanupOldDevicesAsync(int batchSize = 1000, int olderThanDays = 30, int veryOldDays = 365)
    {
        _logger.LogInformation("Device cleanup started. batchSize={BatchSize} olderThanDays={OlderThanDays} veryOldDays={VeryOldDays}", batchSize, olderThanDays, veryOldDays);

        var cutoff = DateTime.UtcNow.AddDays(-olderThanDays);
        var veryOldCutoff = DateTime.UtcNow.AddDays(-veryOldDays);
        var totalDeleted = 0;

        while (true)
        {
            // 削除対象: 無効化済みで古いもの OR 有効だが非常に古いもの
            var items = await _context.Devices
                .Where(d => (d.IsRevoked && d.LastSeenAt <= cutoff) || (!d.IsRevoked && d.LastSeenAt <= veryOldCutoff))
                .OrderBy(d => d.LastSeenAt)
                .Take(batchSize)
                .ToListAsync();

            if (!items.Any()) break;

            _context.Devices.RemoveRange(items);
            await _context.SaveChangesAsync();

            totalDeleted += items.Count;
            _logger.LogInformation("Deleted {Count} device records in this batch", items.Count);

            // 少し待つことでDB負荷を抑える（必要なら調整）
            await Task.Delay(200);
        }

        _logger.LogInformation("Device cleanup completed. totalDeleted={Total}", totalDeleted);
    }

    /// <summary>
    /// 期限切れ・使用済みのメールアドレス変更トークンをバッチで削除します。
    /// - ExpiresAt が現在時刻より過去のもの
    /// - または IsUsed==true で保持期間(olderThanDays)を超えたもの
    /// </summary>
    /// <param name="batchSize">一度に削除する件数</param>
    /// <param name="olderThanDays">使用後に残す日数（この日数より古いものを削除）</param>
    /// <returns></returns>
    public async Task CleanupExpiredEmailChangeTokensAsync(int batchSize = 1000, int olderThanDays = 7)
    {
        _logger.LogInformation("EmailChangeToken cleanup started. batchSize={BatchSize} olderThanDays={OlderThanDays}", batchSize, olderThanDays);

        var cutoff = DateTime.UtcNow.AddDays(-olderThanDays);
        var totalDeleted = 0;

        while (true)
        {
            // 削除対象: 有効期限切れ OR 使用済みで古いもの
            var items = await _context.EmailChangeTokens
                .Where(t => t.ExpiresAt <= DateTime.UtcNow || (t.IsUsed && t.UsedAt <= cutoff))
                .OrderBy(t => t.CreatedAt)
                .Take(batchSize)
                .ToListAsync();

            if (!items.Any()) break;

            _context.EmailChangeTokens.RemoveRange(items);
            await _context.SaveChangesAsync();

            totalDeleted += items.Count;
            _logger.LogInformation("Deleted {Count} email change token records in this batch", items.Count);

            // 少し待つことでDB負荷を抑える（必要なら調整）
            await Task.Delay(200);
        }

        _logger.LogInformation("EmailChangeToken cleanup completed. totalDeleted={Total}", totalDeleted);
    }

    /// <summary>
    /// 古いチャットメッセージを ChatRoomType ごとにバッチで削除します。
    /// - 各タイプの olderThanDays &lt;= 0 の場合はそのタイプをスキップ
    /// - 削除対象: CreatedAt が cutoff 以前のメッセージ（CreatedAt &lt;= cutoff）
    /// - また、ReplyToMessageId を持つメッセージで参照先メッセージが cutoff 以前の場合も削除対象に含める
    /// </summary>
    public async Task CleanupOldChatMessagesAsync(
        int batchSize = 1000,
        int systemOlderThanDays = 90,
        int groupOlderThanDays = 90,
        int dmOlderThanDays = 90,
        int aiOlderThanDays = 90)
    {
        _logger.LogInformation("ChatMessage cleanup started. batchSize={BatchSize} systemOlderThanDays={System} groupOlderThanDays={Group} dmOlderThanDays={Dm} aiOlderThanDays={Ai}",
            batchSize, systemOlderThanDays, groupOlderThanDays, dmOlderThanDays, aiOlderThanDays);

        var totalDeleted = 0;
        var now = DateTimeOffset.UtcNow;

        // 内部関数: 指定タイプを処理
        async Task<int> ProcessTypeAsync(ChatRoomType type, int olderThanDays)
        {
            if (olderThanDays <= 0) return 0;


            var cutoff = now.AddDays(-olderThanDays);
            var deletedForType = 0;

            // 安全かつ確実な処理: 親メッセージ( CreatedAt <= cutoff ) をページングで取得し、
            // 各チャンクごとに親を削除し、その親を参照するリプライを別バッチで削除する。
            // これにより expiredParentIds を一度に全取得して巨大な IN リストを作ることを避ける。
            // chunkSize は親IDのチャンク数（大きすぎるとパラメータ数が増える）、batchSize は削除バッチサイズ。
            const int parentChunkSize = 1000;

            try
            {
                // 親メッセージを ID 昇順でページング取得
                var lastParentId = 0;
                while (true)
                {
                    var parentChunk = await _context.ChatMessages
                        .Where(r => r.ChatRoom.Type == type && r.CreatedAt <= cutoff && r.Id > lastParentId)
                        .OrderBy(r => r.Id)
                        .Select(r => r.Id)
                        .Take(parentChunkSize)
                        .ToListAsync();

                    if (!parentChunk.Any()) break;

                    // 更新 lastParentId for next page
                    lastParentId = parentChunk.Max();

                    // 1) 親メッセージ自体を削除（ID が parentChunk に含まれるもの）
                    var parentsToDelete = await _context.ChatMessages
                        .Where(m => parentChunk.Contains(m.Id))
                        .ToListAsync();

                    if (parentsToDelete.Any())
                    {
                        _context.ChatMessages.RemoveRange(parentsToDelete);
                        await _context.SaveChangesAsync();

                        deletedForType += parentsToDelete.Count;
                        totalDeleted += parentsToDelete.Count;
                        _logger.LogInformation("Deleted {Count} parent chat messages for type {Type}", parentsToDelete.Count, type);
                    }

                    // 2) その親を参照するリプライを削除する（ReplyToMessageId IN parentChunk）
                    while (true)
                    {
                        var replies = await _context.ChatMessages
                            .Where(m => m.ChatRoom.Type == type && m.ReplyToMessageId != null && parentChunk.Contains(m.ReplyToMessageId.Value))
                            .OrderBy(m => m.Id)
                            .Take(batchSize)
                            .ToListAsync();

                        if (!replies.Any()) break;

                        _context.ChatMessages.RemoveRange(replies);
                        await _context.SaveChangesAsync();

                        deletedForType += replies.Count;
                        totalDeleted += replies.Count;
                        _logger.LogInformation("Deleted {Count} reply chat messages referencing parents for type {Type}", replies.Count, type);

                        await Task.Delay(200);
                    }

                    // 若干待機して DB 負荷を抑える
                    await Task.Delay(200);
                }
            }
            catch (Exception ex)
            {
                // ジョブなので可能な限り失敗させずログに残す
                _logger.LogError(ex, "Error during chat cleanup for type {Type}. Continuing with next type.", type);
            }

            _logger.LogInformation("ChatMessage cleanup for {Type} completed. deleted={Deleted}", type, deletedForType);
            return deletedForType;
        }

        await ProcessTypeAsync(ChatRoomType.System, systemOlderThanDays);
        await ProcessTypeAsync(ChatRoomType.Group, groupOlderThanDays);
        await ProcessTypeAsync(ChatRoomType.Dm, dmOlderThanDays);
        await ProcessTypeAsync(ChatRoomType.Ai, aiOlderThanDays);

        _logger.LogInformation("ChatMessage cleanup completed. totalDeleted={Total}", totalDeleted);
    }
}