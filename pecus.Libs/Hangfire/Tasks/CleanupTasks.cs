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

    /// <summary>
    /// 失効済みの外部APIキーをバッチで削除します。
    /// - IsRevoked==true かつ RevokedAt が保持期間(olderThanDays)を超えたもの
    /// </summary>
    /// <param name="batchSize">一度に削除する件数</param>
    /// <param name="olderThanDays">失効後に残す日数（この日数より古いものを削除）</param>
    public async Task CleanupRevokedExternalApiKeysAsync(int batchSize = 1000, int olderThanDays = 30)
    {
        _logger.LogInformation("ExternalApiKey cleanup started. batchSize={BatchSize} olderThanDays={OlderThanDays}", batchSize, olderThanDays);

        var cutoff = DateTimeOffset.UtcNow.AddDays(-olderThanDays);
        var totalDeleted = 0;

        while (true)
        {
            var items = await _context.ExternalApiKeys
                .Where(k => k.IsRevoked && k.RevokedAt != null && k.RevokedAt <= cutoff)
                .OrderBy(k => k.RevokedAt)
                .Take(batchSize)
                .ToListAsync();

            if (items.Count == 0) break;

            _context.ExternalApiKeys.RemoveRange(items);
            await _context.SaveChangesAsync();

            totalDeleted += items.Count;
            _logger.LogInformation("Deleted {Count} revoked external API key records in this batch", items.Count);

            await Task.Delay(200);
        }

        _logger.LogInformation("ExternalApiKey cleanup completed. totalDeleted={TotalDeleted}", totalDeleted);
    }

    /// <summary>
    /// 古いアジェンダと関連データを組織単位でバッチ削除します。
    /// - 単発イベント: EndAt が cutoff 以前
    /// - 繰り返し（終了日指定）: RecurrenceEndDate が cutoff 以前
    /// - 繰り返し（回数指定）: 最終回の EndAt が cutoff 以前
    /// - 繰り返し（無期限）: 削除しない
    /// </summary>
    /// <param name="batchSize">一度に削除する件数</param>
    /// <param name="olderThanDays">終了後に残す日数</param>
    public async Task CleanupOldAgendasAsync(int batchSize = 1000, int olderThanDays = 2)
    {
        _logger.LogInformation("Agenda cleanup started. batchSize={BatchSize} olderThanDays={OlderThanDays}", batchSize, olderThanDays);

        var cutoff = DateTimeOffset.UtcNow.AddDays(-olderThanDays);
        var cutoffDate = DateOnly.FromDateTime(cutoff.UtcDateTime);
        var totalDeletedAgendas = 0;

        // 組織一覧を取得
        var organizationIds = await _context.Organizations
            .AsNoTracking()
            .Select(o => o.Id)
            .ToListAsync();

        foreach (var orgId in organizationIds)
        {
            try
            {
                var deletedInOrg = await CleanupAgendasForOrganizationAsync(orgId, batchSize, cutoff, cutoffDate);
                totalDeletedAgendas += deletedInOrg;

                if (deletedInOrg > 0)
                {
                    _logger.LogInformation("Agenda cleanup for OrganizationId={OrgId}: deleted={Deleted} agendas", orgId, deletedInOrg);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Agenda cleanup failed for OrganizationId={OrgId}. Continuing with next organization.", orgId);
            }
        }

        _logger.LogInformation("Agenda cleanup completed. totalDeletedAgendas={Total}", totalDeletedAgendas);
    }

    /// <summary>
    /// 組織単位でアジェンダをクリーンアップ
    /// </summary>
    private async Task<int> CleanupAgendasForOrganizationAsync(int organizationId, int batchSize, DateTimeOffset cutoff, DateOnly cutoffDate)
    {
        var totalDeleted = 0;

        while (true)
        {
            // 削除対象のアジェンダIDを取得
            var targetAgendaIds = await _context.Agendas
                .AsNoTracking()
                .Where(a => a.OrganizationId == organizationId)
                .Where(a =>
                    // 単発イベント: EndAt が cutoff 以前
                    ((a.RecurrenceType == null || a.RecurrenceType == RecurrenceType.None) && a.EndAt <= cutoff)
                    ||
                    // 繰り返し（終了日指定）: RecurrenceEndDate が cutoff 以前
                    (a.RecurrenceType != null && a.RecurrenceType != RecurrenceType.None && a.RecurrenceEndDate != null && a.RecurrenceEndDate <= cutoffDate)
                )
                .OrderBy(a => a.Id)
                .Select(a => a.Id)
                .Take(batchSize)
                .ToListAsync();

            if (targetAgendaIds.Count == 0)
                break;

            // 関連テーブルを削除（子から順に）
            // 1. AgendaNotification
            var notifications = await _context.AgendaNotifications
                .Where(n => targetAgendaIds.Contains(n.AgendaId))
                .ToListAsync();
            if (notifications.Count > 0)
            {
                _context.AgendaNotifications.RemoveRange(notifications);
                await _context.SaveChangesAsync();
            }

            // 2. AgendaReminderLog
            var reminderLogs = await _context.AgendaReminderLogs
                .Where(l => targetAgendaIds.Contains(l.AgendaId))
                .ToListAsync();
            if (reminderLogs.Count > 0)
            {
                _context.AgendaReminderLogs.RemoveRange(reminderLogs);
                await _context.SaveChangesAsync();
            }

            // 3. AgendaAttendanceResponse
            var attendanceResponses = await _context.AgendaAttendanceResponses
                .Where(r => targetAgendaIds.Contains(r.AgendaId))
                .ToListAsync();
            if (attendanceResponses.Count > 0)
            {
                _context.AgendaAttendanceResponses.RemoveRange(attendanceResponses);
                await _context.SaveChangesAsync();
            }

            // 4. AgendaAttendee
            var attendees = await _context.AgendaAttendees
                .Where(a => targetAgendaIds.Contains(a.AgendaId))
                .ToListAsync();
            if (attendees.Count > 0)
            {
                _context.AgendaAttendees.RemoveRange(attendees);
                await _context.SaveChangesAsync();
            }

            // 5. AgendaException
            var exceptions = await _context.AgendaExceptions
                .Where(e => targetAgendaIds.Contains(e.AgendaId))
                .ToListAsync();
            if (exceptions.Count > 0)
            {
                _context.AgendaExceptions.RemoveRange(exceptions);
                await _context.SaveChangesAsync();
            }

            // 6. Agenda本体を削除
            var agendas = await _context.Agendas
                .Where(a => targetAgendaIds.Contains(a.Id))
                .ToListAsync();
            if (agendas.Count > 0)
            {
                _context.Agendas.RemoveRange(agendas);
                await _context.SaveChangesAsync();
                totalDeleted += agendas.Count;
            }

            // DB負荷軽減のため少し待機
            await Task.Delay(200);
        }

        return totalDeleted;
    }
}