using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.Focus.Models;

namespace Pecus.Libs.Focus;

/// <summary>
/// 今日のアジェンダ取得サービス（Libs内部用）
/// </summary>
public interface IAgendaProvider
{
    /// <summary>
    /// ユーザーの今日のアジェンダを取得する
    /// 繰り返しイベントの展開・例外（特定回の中止/変更）を考慮
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="userId">ユーザーID</param>
    /// <param name="userTimeZone">ユーザーのタイムゾーン（IANA形式）</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>今日のアジェンダ一覧（開始時刻順）</returns>
    Task<List<TodayAgendaInfo>> GetTodayAgendasAsync(
        int organizationId,
        int userId,
        string userTimeZone,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// 今日のアジェンダ取得サービス実装
/// </summary>
public class AgendaProvider : IAgendaProvider
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// AgendaProvider のコンストラクタ
    /// </summary>
    public AgendaProvider(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<TodayAgendaInfo>> GetTodayAgendasAsync(
        int organizationId,
        int userId,
        string userTimeZone,
        CancellationToken cancellationToken = default)
    {
        // ユーザーのローカル日付で「今日」を判定
        var tz = TimeZoneInfo.FindSystemTimeZoneById(userTimeZone);
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        var localTodayStart = localNow.Date;
        var todayStart = new DateTimeOffset(localTodayStart, tz.GetUtcOffset(localTodayStart));
        var todayEnd = todayStart.AddDays(1);

        // ユーザーが参加者で、今日と重なる可能性のあるアジェンダを取得
        // 繰り返しイベントは StartAt が過去でも今日のオカレンスがあり得るため、
        // IsCancelled でないもの全てを候補にし RecurrenceHelper で展開する
        var agendas = await _context.Agendas
            .AsNoTracking()
            .Include(a => a.Attendees)
            .Include(a => a.Exceptions)
            .Where(a => a.OrganizationId == organizationId
                && !a.IsCancelled
                && a.Attendees.Any(at => at.UserId == userId))
            .ToListAsync(cancellationToken);

        var result = new List<TodayAgendaInfo>();

        foreach (var agenda in agendas)
        {
            // 繰り返しイベントを展開して今日に該当するオカレンスを抽出
            var occurrences = RecurrenceHelper.ExpandOccurrencesWithIndex(
                agenda, todayStart, todayEnd);

            var duration = agenda.EndAt - agenda.StartAt;

            foreach (var occ in occurrences)
            {
                // 例外（特定回の中止/変更）チェック
                var exception = agenda.Exceptions
                    .FirstOrDefault(e => e.OccurrenceIndex == occ.Index);

                if (exception?.IsCancelled == true)
                    continue;

                var occStart = exception?.ModifiedStartAt ?? occ.StartAt;
                var occEnd = exception?.ModifiedEndAt ?? (occ.StartAt + duration);

                result.Add(new TodayAgendaInfo
                {
                    Id = agenda.Id,
                    Title = exception?.ModifiedTitle ?? agenda.Title,
                    StartAt = occStart,
                    EndAt = occEnd,
                    IsAllDay = agenda.IsAllDay,
                    Location = exception?.ModifiedLocation ?? agenda.Location,
                });
            }
        }

        return result.OrderBy(a => a.StartAt).ToList();
    }
}
