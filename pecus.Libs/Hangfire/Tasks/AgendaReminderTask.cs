using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// アジェンダリマインダー配信タスク
/// 繰り返しイベントの各回に対して、設定されたタイミングでリマインダー通知を送信する
/// </summary>
public class AgendaReminderTask
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AgendaReminderTask> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    public AgendaReminderTask(
        ApplicationDbContext context,
        ILogger<AgendaReminderTask> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// リマインダー処理を実行（5分ごとに実行される想定）
    /// </summary>
    public async Task ProcessRemindersAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var lookAheadEnd = now.AddHours(25); // 1日前リマインダー + バッファ用に25時間先まで

        _logger.LogDebug(
            "アジェンダリマインダー処理開始: {Now} - {LookAheadEnd}",
            now, lookAheadEnd);

        // 対象となるアジェンダを取得
        var agendas = await GetUpcomingAgendasAsync(now, lookAheadEnd);

        if (agendas.Count == 0)
        {
            _logger.LogDebug("リマインダー対象のアジェンダはありません");
            return;
        }

        _logger.LogInformation(
            "リマインダー対象のアジェンダが{Count}件見つかりました",
            agendas.Count);

        var totalReminders = 0;

        foreach (var agenda in agendas)
        {
            try
            {
                var count = await ProcessAgendaRemindersAsync(agenda, now);
                totalReminders += count;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "アジェンダリマインダー処理に失敗: AgendaId={AgendaId}, Title={Title}",
                    agenda.Id, agenda.Title);
            }
        }

        _logger.LogInformation(
            "アジェンダリマインダー処理完了: 送信数={TotalReminders}",
            totalReminders);
    }

    /// <summary>
    /// 今後のアジェンダを取得
    /// </summary>
    private async Task<List<Agenda>> GetUpcomingAgendasAsync(DateTimeOffset now, DateTimeOffset lookAheadEnd)
    {
        return await _context.Agendas
            .AsNoTracking()
            .Include(a => a.Attendees)
            .Include(a => a.Exceptions)
            .Where(a =>
                !a.IsCancelled &&
                // 単発イベント: 期間内に開始
                ((a.RecurrenceType == null || a.RecurrenceType == RecurrenceType.None)
                    ? (a.StartAt > now && a.StartAt <= lookAheadEnd)
                    // 繰り返しイベント: 開始日が過去または期間内、終了条件が期間開始より後（または無期限）
                    : (a.StartAt <= lookAheadEnd &&
                       (a.RecurrenceEndDate == null ||
                        a.RecurrenceEndDate >= DateOnly.FromDateTime(now.UtcDateTime)))))
            .ToListAsync();
    }

    /// <summary>
    /// 個別アジェンダのリマインダー処理
    /// </summary>
    private async Task<int> ProcessAgendaRemindersAsync(Agenda agenda, DateTimeOffset now)
    {
        var remindersSent = 0;
        var lookAheadEnd = now.AddHours(25);

        // オカレンス（回）を展開
        var occurrences = RecurrenceHelper.ExpandOccurrences(agenda, now, lookAheadEnd);

        foreach (var occurrenceStart in occurrences)
        {
            // この回が例外で中止されていないか確認
            var exception = agenda.Exceptions?.FirstOrDefault(e => e.OriginalStartAt == occurrenceStart);
            if (exception?.IsCancelled == true)
                continue;

            // 例外で日時が変更されている場合はその日時を使用
            var actualStart = exception?.ModifiedStartAt ?? occurrenceStart;

            // 過去のオカレンスはスキップ
            if (actualStart <= now)
                continue;

            // 各参加者に対してリマインダーを送信
            foreach (var attendee in agenda.Attendees)
            {
                // 不参加の人にはリマインダーを送らない
                if (attendee.Status == AttendanceStatus.Declined)
                    continue;

                var count = await ProcessAttendeeRemindersAsync(
                    agenda, attendee, actualStart, now);
                remindersSent += count;
            }
        }

        return remindersSent;
    }

    /// <summary>
    /// 個別参加者のリマインダー処理
    /// </summary>
    private async Task<int> ProcessAttendeeRemindersAsync(
        Agenda agenda,
        AgendaAttendee attendee,
        DateTimeOffset occurrenceStart,
        DateTimeOffset now)
    {
        var remindersSent = 0;

        // 個人設定 or デフォルト設定からリマインダー分数リストを取得
        var reminders = ParseReminders(attendee.CustomReminders ?? agenda.DefaultReminders);

        if (reminders == null || reminders.Count == 0)
            return 0;

        foreach (var minutesBefore in reminders)
        {
            var reminderTime = occurrenceStart.AddMinutes(-minutesBefore);

            // リマインダー時刻が未来の場合は、現在〜5分後の範囲内かチェック
            // リマインダー時刻が過去の場合でも、イベント開始前なら送信対象とする
            // （遅延実行やサービス再起動後でもリマインダーが届くように）
            var isInUpcomingWindow = reminderTime >= now && reminderTime <= now.AddMinutes(5);
            var isMissedButEventNotStarted = reminderTime < now && occurrenceStart > now;

            if (!isInUpcomingWindow && !isMissedButEventNotStarted)
                continue;

            // 既に送信済みか確認
            var alreadySent = await _context.AgendaReminderLogs
                .AnyAsync(l =>
                    l.AgendaId == agenda.Id &&
                    l.UserId == attendee.UserId &&
                    l.OccurrenceStartAt == occurrenceStart &&
                    l.MinutesBefore == minutesBefore);

            if (alreadySent)
                continue;

            // 通知作成 + ログ記録
            await SendReminderAsync(agenda, attendee, occurrenceStart, minutesBefore);
            remindersSent++;
        }

        return remindersSent;
    }

    /// <summary>
    /// リマインダーを送信（通知作成 + ログ記録）
    /// </summary>
    private async Task SendReminderAsync(
        Agenda agenda,
        AgendaAttendee attendee,
        DateTimeOffset occurrenceStart,
        int minutesBefore)
    {
        var message = FormatReminderMessage(minutesBefore);

        // 通知を作成
        var notification = new AgendaNotification
        {
            AgendaId = agenda.Id,
            UserId = attendee.UserId,
            Type = AgendaNotificationType.Reminder,
            OccurrenceStartAt = occurrenceStart,
            Message = message,
            IsRead = false,
            IsEmailSent = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.AgendaNotifications.Add(notification);

        // 送信ログを記録（重複送信防止）
        var log = new AgendaReminderLog
        {
            AgendaId = agenda.Id,
            UserId = attendee.UserId,
            OccurrenceStartAt = occurrenceStart,
            MinutesBefore = minutesBefore,
            SentAt = DateTimeOffset.UtcNow
        };

        _context.AgendaReminderLogs.Add(log);

        await _context.SaveChangesAsync();

        _logger.LogDebug(
            "リマインダー送信: AgendaId={AgendaId}, UserId={UserId}, OccurrenceStart={OccurrenceStart}, MinutesBefore={MinutesBefore}",
            agenda.Id, attendee.UserId, occurrenceStart, minutesBefore);
    }

    /// <summary>
    /// リマインダーメッセージをフォーマット
    /// </summary>
    private static string FormatReminderMessage(int minutesBefore)
    {
        return minutesBefore switch
        {
            >= 10080 => $"{minutesBefore / 10080}週間前のリマインダー",
            >= 1440 => $"{minutesBefore / 1440}日前のリマインダー",
            >= 60 => $"{minutesBefore / 60}時間前のリマインダー",
            > 0 => $"{minutesBefore}分前のリマインダー",
            _ => "開始時のリマインダー"
        };
    }

    /// <summary>
    /// リマインダー文字列をリストに変換
    /// </summary>
    private static List<int>? ParseReminders(string? reminders)
    {
        if (string.IsNullOrWhiteSpace(reminders)) return null;
        return reminders.Split(',')
            .Select(s => int.TryParse(s.Trim(), out var v) ? v : (int?)null)
            .Where(v => v.HasValue)
            .Select(v => v!.Value)
            .OrderByDescending(x => x)
            .ToList();
    }
}
