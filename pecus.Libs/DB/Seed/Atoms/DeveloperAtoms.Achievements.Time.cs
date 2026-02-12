using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Pecus.Libs.DB.Seed.Atoms;

/// <summary>
/// Achievement テストデータ - 時間系
/// EarlyBird, NightOwl, WeekendGuardian
/// </summary>
public partial class DeveloperAtoms
{
    /// <summary>
    /// EarlyBird（暁の開拓者）テストデータ
    /// 条件: 午前5時～7時（JST）にタスク完了
    /// 参照: EarlyBirdStrategy.cs
    /// </summary>
    private async Task SeedEarlyBirdTestDataAsync()
    {
        // ===== 判定条件（EarlyBirdStrategy と同じ値） =====
        const int StartHour = 5;
        const int EndHour = 7;
        const string TimeZoneId = "Asia/Tokyo";
        // 判定式: hour >= StartHour && hour < EndHour

        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);
        var baseDate = DateTime.Today;

        var completedTasks = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted && t.CompletedAt != null)
            .OrderBy(t => t.Id)
            .Take(10)
            .ToListAsync();

        if (completedTasks.Count < 5)
        {
            _logger.LogWarning("EarlyBird: Not enough completed tasks for test data");
            return;
        }

        var index = 0;

        // ===== 条件を満たすデータ（3件） =====

        // 6:00 JST → 5 <= 6 < 7 → true（達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate, hour: 6, minute: 0, tz);

        // 5:00 JST（境界値: 開始時刻ちょうど） → 5 <= 5 < 7 → true（達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate, hour: 5, minute: 0, tz);

        // 6:59 JST（境界値: 終了時刻の1分前） → 5 <= 6 < 7 → true（達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate, hour: 6, minute: 59, tz);

        // ===== 条件を満たさないデータ（2件） =====

        // 7:00 JST（境界値: 終了時刻ちょうど） → 5 <= 7 < 7 → false（未達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate, hour: 7, minute: 0, tz);

        // 10:00 JST → 5 <= 10 < 7 → false（未達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate, hour: 10, minute: 0, tz);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "EarlyBird: 3 tasks at {Start}:00-{End}:00 JST (qualify), 2 tasks outside (non-qualify)",
            StartHour, EndHour);
    }

    /// <summary>
    /// NightOwl（夜更かしの梟）テストデータ
    /// 条件: 午後10時～午前2時（JST）にタスク完了
    /// 参照: NightOwlStrategy.cs
    /// </summary>
    private async Task SeedNightOwlTestDataAsync()
    {
        // ===== 判定条件（NightOwlStrategy と同じ値） =====
        const int StartHour = 22;
        const int EndHour = 2;
        const string TimeZoneId = "Asia/Tokyo";
        // 判定式: hour >= StartHour || hour < EndHour

        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);
        var baseDate = DateTime.Today;

        var completedTasks = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted && t.CompletedAt != null)
            .OrderBy(t => t.Id)
            .Skip(10)
            .Take(10)
            .ToListAsync();

        if (completedTasks.Count < 5)
        {
            _logger.LogWarning("NightOwl: Not enough completed tasks for test data");
            return;
        }

        var index = 0;

        // ===== 条件を満たすデータ（3件） =====

        // 23:00 JST → 23 >= 22 → true（達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate, hour: 23, minute: 0, tz);

        // 22:00 JST（境界値: 開始時刻ちょうど） → 22 >= 22 → true（達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate, hour: 22, minute: 0, tz);

        // 1:00 JST（翌日深夜） → 1 < 2 → true（達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate.AddDays(1), hour: 1, minute: 0, tz);

        // ===== 条件を満たさないデータ（2件） =====

        // 2:00 JST（境界値: 終了時刻ちょうど） → 2 >= 22 = false, 2 < 2 = false → false（未達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate.AddDays(1), hour: 2, minute: 0, tz);

        // 15:00 JST → 15 >= 22 = false, 15 < 2 = false → false（未達成）
        completedTasks[index++].CompletedAt = ToJstUtc(baseDate, hour: 15, minute: 0, tz);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "NightOwl: 3 tasks at {Start}:00-{End}:00 JST (qualify), 2 tasks outside (non-qualify)",
            StartHour, EndHour);
    }

    /// <summary>
    /// WeekendGuardian（週末の守護者）テストデータ
    /// 条件: 土曜日または日曜日（JST）にタスク完了
    /// 参照: WeekendGuardianStrategy.cs
    /// </summary>
    private async Task SeedWeekendGuardianTestDataAsync()
    {
        // ===== 判定条件（WeekendGuardianStrategy と同じ値） =====
        const string TimeZoneId = "Asia/Tokyo";
        // 判定式: DayOfWeek == Saturday || DayOfWeek == Sunday

        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);

        // 次の土曜日を取得
        var baseDate = DateTime.Today;
        while (baseDate.DayOfWeek != DayOfWeek.Saturday)
        {
            baseDate = baseDate.AddDays(1);
        }
        var saturday = baseDate;
        var sunday = baseDate.AddDays(1);
        var monday = baseDate.AddDays(2);
        var friday = baseDate.AddDays(-1);

        var completedTasks = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted && t.CompletedAt != null)
            .OrderBy(t => t.Id)
            .Skip(20)
            .Take(10)
            .ToListAsync();

        if (completedTasks.Count < 5)
        {
            _logger.LogWarning("WeekendGuardian: Not enough completed tasks for test data");
            return;
        }

        var index = 0;

        // ===== 条件を満たすデータ（3件） =====

        // 土曜日 10:00 JST → Saturday → true（達成）
        completedTasks[index++].CompletedAt = ToJstUtc(saturday, hour: 10, minute: 0, tz);

        // 日曜日 15:00 JST → Sunday → true（達成）
        completedTasks[index++].CompletedAt = ToJstUtc(sunday, hour: 15, minute: 0, tz);

        // 土曜日 23:59 JST（境界値: 土曜日の終わり際） → Saturday → true（達成）
        completedTasks[index++].CompletedAt = ToJstUtc(saturday, hour: 23, minute: 59, tz);

        // ===== 条件を満たさないデータ（2件） =====

        // 月曜日 0:00 JST（境界値: 週末直後） → Monday → false（未達成）
        completedTasks[index++].CompletedAt = ToJstUtc(monday, hour: 0, minute: 0, tz);

        // 金曜日 18:00 JST → Friday → false（未達成）
        completedTasks[index++].CompletedAt = ToJstUtc(friday, hour: 18, minute: 0, tz);

        await _context.SaveChangesAsync();

        _logger.LogInformation("WeekendGuardian: 3 tasks on weekend (qualify), 2 tasks on weekday (non-qualify)");
    }
}