using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Seed.Atoms;

/// <summary>
/// Achievement テストデータ - 品質系
/// EstimationWizard, PriorityHunter, Multitasker, SteadyHand, StreakMaster, PerfectWeek, InboxZero
/// </summary>
public partial class DeveloperAtoms
{
    /// <summary>
    /// EstimationWizard（見積もりの魔術師）テストデータ
    /// 条件: 見積時間と実績時間の誤差が10%以内のタスクを10件完了した
    /// 参照: EstimationWizardStrategy.cs
    /// </summary>
    private async Task SeedEstimationWizardTestDataAsync()
    {
        // ===== 判定条件（EstimationWizardStrategy と同じ値） =====
        const int RequiredCount = 10;
        const double AllowedErrorPercentage = 0.1;
        // 判定式: |EstimatedHours - ActualHours| / EstimatedHours <= 0.1, Count >= 10

        var tasksByUser = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= 15)
            .OrderBy(g => g.Key)
            .Skip(6)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderBy(t => t.Id).Take(15).ToList() })
            .ToListAsync();

        if (tasksByUser.Count < 2)
        {
            _logger.LogWarning("EstimationWizard: Not enough users with 15+ tasks for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 10件が誤差10%以内） =====
        var qualifyUser = tasksByUser[0];
        for (int i = 0; i < qualifyUser.Tasks.Count; i++)
        {
            var task = qualifyUser.Tasks[i];
            if (i < 10)
            {
                // 10件: 見積10h、実績9.5h → 誤差5% <= 10% → true
                task.EstimatedHours = 10m;
                task.ActualHours = 9.5m;
            }
            else
            {
                // 残り: 見積10h、実績15h → 誤差50% > 10% → false
                task.EstimatedHours = 10m;
                task.ActualHours = 15m;
            }
        }

        // ===== 条件を満たさないユーザー（2人目: 9件のみ誤差10%以内） =====
        var nonQualifyUser = tasksByUser[1];
        for (int i = 0; i < nonQualifyUser.Tasks.Count; i++)
        {
            var task = nonQualifyUser.Tasks[i];
            if (i < 9)
            {
                // 9件: 誤差10%以内 → true だが RequiredCount(10) に満たない
                task.EstimatedHours = 10m;
                task.ActualHours = 10m;
            }
            else
            {
                // 残り: 誤差50%
                task.EstimatedHours = 10m;
                task.ActualHours = 15m;
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "EstimationWizard: User1 has {Required}+ tasks within {Error}% error (qualify), User2 has {Less} tasks (non-qualify)",
            RequiredCount, AllowedErrorPercentage * 100, RequiredCount - 1);
    }

    /// <summary>
    /// PriorityHunter（高優先度ハンター）テストデータ
    /// 条件: 高優先度タスクを5件完了した
    /// 参照: PriorityHunterStrategy.cs
    /// </summary>
    private async Task SeedPriorityHunterTestDataAsync()
    {
        // ===== 判定条件（PriorityHunterStrategy と同じ値） =====
        const int RequiredCount = 5;
        // 判定式: Priority == High && IsCompleted, Count >= 5

        var tasksByUser = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= 10)
            .OrderBy(g => g.Key)
            .Skip(8)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderBy(t => t.Id).Take(10).ToList() })
            .ToListAsync();

        if (tasksByUser.Count < 2)
        {
            _logger.LogWarning("PriorityHunter: Not enough users with 10+ tasks for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 5件がHigh優先度） =====
        var qualifyUser = tasksByUser[0];
        for (int i = 0; i < qualifyUser.Tasks.Count; i++)
        {
            var task = qualifyUser.Tasks[i];
            if (i < 5)
            {
                // 5件: High優先度 → true
                task.Priority = TaskPriority.High;
            }
            else
            {
                // 残り: Medium優先度 → false
                task.Priority = TaskPriority.Medium;
            }
        }

        // ===== 条件を満たさないユーザー（2人目: 4件のみHigh優先度） =====
        var nonQualifyUser = tasksByUser[1];
        for (int i = 0; i < nonQualifyUser.Tasks.Count; i++)
        {
            var task = nonQualifyUser.Tasks[i];
            if (i < 4)
            {
                // 4件: High優先度 → true だが RequiredCount(5) に満たない
                task.Priority = TaskPriority.High;
            }
            else
            {
                // 残り: Medium優先度
                task.Priority = TaskPriority.Medium;
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "PriorityHunter: User1 has {Required}+ high-priority tasks (qualify), User2 has {Less} tasks (non-qualify)",
            RequiredCount, RequiredCount - 1);
    }

    /// <summary>
    /// Multitasker（マルチタスカー）テストデータ
    /// 条件: 同時に10件以上のタスクを担当している
    /// 参照: MultitaskerStrategy.cs
    /// </summary>
    private async Task SeedMultitaskerTestDataAsync()
    {
        // ===== 判定条件（MultitaskerStrategy と同じ値） =====
        const int RequiredCount = 10;
        // 判定式: !IsCompleted && !IsDiscarded, Count >= 10

        var tasksByUser = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= 15)
            .OrderBy(g => g.Key)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderBy(t => t.Id).Take(15).ToList() })
            .ToListAsync();

        if (tasksByUser.Count < 2)
        {
            _logger.LogWarning("Multitasker: Not enough users with 15+ incomplete tasks for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 10件以上がアクティブ） =====
        var qualifyUser = tasksByUser[0];
        for (int i = 0; i < qualifyUser.Tasks.Count; i++)
        {
            var task = qualifyUser.Tasks[i];
            if (i < 10)
            {
                // 10件: アクティブ（未完了・未破棄） → true
                task.IsCompleted = false;
                task.IsDiscarded = false;
            }
            else
            {
                // 残り: 完了済み → カウント外
                task.IsCompleted = true;
                task.CompletedAt = DateTimeOffset.UtcNow;
            }
        }

        // ===== 条件を満たさないユーザー（2人目: 9件のみアクティブ） =====
        var nonQualifyUser = tasksByUser[1];
        for (int i = 0; i < nonQualifyUser.Tasks.Count; i++)
        {
            var task = nonQualifyUser.Tasks[i];
            if (i < 9)
            {
                // 9件: アクティブ → true だが RequiredCount(10) に満たない
                task.IsCompleted = false;
                task.IsDiscarded = false;
            }
            else
            {
                // 残り: 完了済み
                task.IsCompleted = true;
                task.CompletedAt = DateTimeOffset.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Multitasker: User1 has {Required}+ active tasks (qualify), User2 has {Less} tasks (non-qualify)",
            RequiredCount, RequiredCount - 1);
    }

    /// <summary>
    /// SteadyHand（安定の担当者）テストデータ
    /// 条件: 30日連続でタスクを担当し続けている（30日以上前に作成されたアクティブタスクを持つ）
    /// 参照: SteadyHandStrategy.cs
    /// </summary>
    private async Task SeedSteadyHandTestDataAsync()
    {
        // ===== 判定条件（SteadyHandStrategy と同じ値） =====
        const int RequiredDays = 30;
        // 判定式: !IsCompleted && !IsDiscarded && CreatedAt <= (now - 30days)

        var now = DateTimeOffset.UtcNow;

        var tasks = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .OrderBy(t => t.Id)
            .Take(10)
            .ToListAsync();

        if (tasks.Count < 4)
        {
            _logger.LogWarning("SteadyHand: Not enough incomplete tasks for test data");
            return;
        }

        // ===== 条件を満たすデータ（2件） =====

        // 40日前に作成 → 40 >= 30 → true（達成）
        tasks[0].CreatedAt = now.AddDays(-40);

        // 30日前に作成（境界値: ちょうど30日） → 30 >= 30 → true（達成）
        tasks[1].CreatedAt = now.AddDays(-30);

        // ===== 条件を満たさないデータ（2件） =====

        // 29日前に作成（境界値: 30日未満） → 29 >= 30 → false（未達成）
        tasks[2].CreatedAt = now.AddDays(-29);

        // 10日前に作成 → 10 >= 30 → false（未達成）
        tasks[3].CreatedAt = now.AddDays(-10);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "SteadyHand: 2 tasks created {Required}+ days ago (qualify), 2 tasks created recently (non-qualify)",
            RequiredDays);
    }

    /// <summary>
    /// StreakMaster（連続達成）テストデータ
    /// 条件: 7日連続でタスクを完了した
    /// 参照: StreakMasterStrategy.cs
    /// </summary>
    private async Task SeedStreakMasterTestDataAsync()
    {
        // ===== 判定条件（StreakMasterStrategy と同じ値） =====
        const int RequiredDays = 7;
        const string TimeZoneId = "Asia/Tokyo";
        // 判定式: 連続する日数で CompletedAt がある日が RequiredDays 以上

        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);
        var baseDate = DateTime.Today;

        var tasksByUser = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted && t.CompletedAt != null)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= 10)
            .OrderBy(g => g.Key)
            .Skip(10)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderBy(t => t.Id).Take(10).ToList() })
            .ToListAsync();

        if (tasksByUser.Count < 2)
        {
            _logger.LogWarning("StreakMaster: Not enough users with 10+ tasks for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 7日連続で完了） =====
        var qualifyUser = tasksByUser[0];
        for (int i = 0; i < Math.Min(7, qualifyUser.Tasks.Count); i++)
        {
            // 7日連続: 今日から遡って1日ずつ → true
            qualifyUser.Tasks[i].CompletedAt = ToJstUtc(baseDate.AddDays(-i), hour: 12, minute: 0, tz);
        }

        // ===== 条件を満たさないユーザー（2人目: 6日連続で途切れ） =====
        var nonQualifyUser = tasksByUser[1];
        for (int i = 0; i < Math.Min(6, nonQualifyUser.Tasks.Count); i++)
        {
            // 6日連続: RequiredDays(7) に満たない
            nonQualifyUser.Tasks[i].CompletedAt = ToJstUtc(baseDate.AddDays(-i), hour: 12, minute: 0, tz);
        }
        // 7日目をスキップして8日目に完了 → ストリーク断絶
        if (nonQualifyUser.Tasks.Count > 6)
        {
            nonQualifyUser.Tasks[6].CompletedAt = ToJstUtc(baseDate.AddDays(-8), hour: 12, minute: 0, tz);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "StreakMaster: User1 has {Required} consecutive days (qualify), User2 has 6 days with gap (non-qualify)",
            RequiredDays);
    }

    /// <summary>
    /// PerfectWeek（パーフェクトウィーク）テストデータ
    /// 条件: 1週間で全タスクを期限内に完了した（最低5件以上）
    /// 参照: PerfectWeekStrategy.cs
    /// </summary>
    private async Task SeedPerfectWeekTestDataAsync()
    {
        // ===== 判定条件（PerfectWeekStrategy と同じ値） =====
        const int MinimumTasks = 5;
        const string TimeZoneId = "Asia/Tokyo";
        // 判定式: 今週完了のタスクが5件以上 && 全て CompletedAt.Date <= DueDate.Date

        var tz = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);
        var baseDate = DateTime.Today;

        // 今週の月曜日を取得（UTC として扱う）
        var daysToSubtract = ((int)baseDate.DayOfWeek + 6) % 7;
        var weekStart = baseDate.AddDays(-daysToSubtract);
        var weekStartUtc = new DateTimeOffset(weekStart.Year, weekStart.Month, weekStart.Day, 0, 0, 0, TimeSpan.Zero);

        var tasksByUser = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted && t.CompletedAt != null)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= 10)
            .OrderBy(g => g.Key)
            .Skip(12)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderBy(t => t.Id).Take(10).ToList() })
            .ToListAsync();

        if (tasksByUser.Count < 2)
        {
            _logger.LogWarning("PerfectWeek: Not enough users with 10+ tasks for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 5件が今週・全て期限内） =====
        var qualifyUser = tasksByUser[0];
        for (int i = 0; i < qualifyUser.Tasks.Count; i++)
        {
            var task = qualifyUser.Tasks[i];
            if (i < 5)
            {
                // 5件: 今週完了 & 期限内 → true
                task.CompletedAt = ToJstUtc(weekStart.AddDays(i % 5), hour: 12, minute: 0, tz);
                task.DueDate = weekStartUtc.AddDays(i % 5 + 1);
            }
            else
            {
                // 残り: 先週完了（カウント外）
                task.CompletedAt = ToJstUtc(weekStart.AddDays(-7 + i), hour: 12, minute: 0, tz);
                task.DueDate = weekStartUtc.AddDays(-7 + i + 1);
            }
        }

        // ===== 条件を満たさないユーザー（2人目: 5件だが1件期限超過） =====
        var nonQualifyUser = tasksByUser[1];
        for (int i = 0; i < nonQualifyUser.Tasks.Count; i++)
        {
            var task = nonQualifyUser.Tasks[i];
            if (i < 4)
            {
                // 4件: 今週完了 & 期限内
                task.CompletedAt = ToJstUtc(weekStart.AddDays(i), hour: 12, minute: 0, tz);
                task.DueDate = weekStartUtc.AddDays(i + 1);
            }
            else if (i == 4)
            {
                // 1件: 今週完了だが期限超過 → All() が false になる
                task.CompletedAt = ToJstUtc(weekStart.AddDays(4), hour: 12, minute: 0, tz);
                task.DueDate = weekStartUtc.AddDays(3);
            }
            else
            {
                // 残り: 先週完了
                task.CompletedAt = ToJstUtc(weekStart.AddDays(-7 + i), hour: 12, minute: 0, tz);
                task.DueDate = weekStartUtc.AddDays(-7 + i + 1);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "PerfectWeek: User1 has {Minimum}+ tasks all on-time this week (qualify), User2 has 1 overdue (non-qualify)",
            MinimumTasks);
    }

    /// <summary>
    /// InboxZero（インボックスゼロ）テストデータ
    /// 条件: 担当タスクをすべて完了した状態（未完了タスクがゼロ）
    /// 参照: InboxZeroStrategy.cs
    /// </summary>
    private async Task SeedInboxZeroTestDataAsync()
    {
        // ===== 判定条件（InboxZeroStrategy と同じ値） =====
        // 判定式: !IsCompleted && !IsDiscarded のタスクが0件

        // Note: InboxZero はユーザーに未完了タスクがないことを判定するため、
        // 既存データの状態に依存。ここでは説明のみ記載
        _logger.LogInformation(
            "InboxZero: Requires 0 incomplete tasks for user (data-dependent, no modification)");
    }
}
