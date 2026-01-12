using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Seed.Atoms;

/// <summary>
/// Achievement テストデータ - タスク完了系
/// AheadOfSchedule, DeadlineMaster, SpeedStar, EstimationWizard, etc
/// </summary>
public partial class DeveloperAtoms
{
    /// <summary>
    /// AheadOfSchedule（前倒しマスター）テストデータ
    /// 条件: 期限より3日以上前に完了したタスクが10件以上
    /// 参照: AheadOfScheduleStrategy.cs
    /// </summary>
    private async Task SeedAheadOfScheduleTestDataAsync()
    {
        // ===== 判定条件（AheadOfScheduleStrategy と同じ値） =====
        const int RequiredCount = 10;
        const int DaysAhead = 3;
        // 判定式: (DueDate.Date - CompletedAt.Date).TotalDays >= DaysAhead, Count >= RequiredCount

        var baseDate = DateTimeOffset.UtcNow;

        // ユーザーごとにタスクをグループ化して取得
        var tasksByUser = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted && t.CompletedAt != null)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= 15)
            .OrderBy(g => g.Key)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderBy(t => t.Id).Take(15).ToList() })
            .ToListAsync();

        if (tasksByUser.Count < 2)
        {
            _logger.LogWarning("AheadOfSchedule: Not enough users with 15+ tasks for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 10件が3日以上前倒し） =====
        var qualifyUser = tasksByUser[0];
        for (int i = 0; i < qualifyUser.Tasks.Count; i++)
        {
            var task = qualifyUser.Tasks[i];
            if (i < 10)
            {
                // 10件: 期限の5日前に完了 → (DueDate - CompletedAt) = 5 >= 3 → true
                task.DueDate = baseDate.AddDays(10);
                task.CompletedAt = baseDate.AddDays(5);
            }
            else
            {
                // 残り: 期限の1日前に完了 → (DueDate - CompletedAt) = 1 < 3 → false（カウント外）
                task.DueDate = baseDate.AddDays(10);
                task.CompletedAt = baseDate.AddDays(9);
            }
        }

        // ===== 条件を満たさないユーザー（2人目: 9件のみ3日以上前倒し） =====
        var nonQualifyUser = tasksByUser[1];
        for (int i = 0; i < nonQualifyUser.Tasks.Count; i++)
        {
            var task = nonQualifyUser.Tasks[i];
            if (i < 9)
            {
                // 9件: 期限の5日前に完了 → true だが RequiredCount(10) に満たない
                task.DueDate = baseDate.AddDays(10);
                task.CompletedAt = baseDate.AddDays(5);
            }
            else
            {
                // 残り: 期限の2日前に完了 → (DueDate - CompletedAt) = 2 < 3 → false
                task.DueDate = baseDate.AddDays(10);
                task.CompletedAt = baseDate.AddDays(8);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "AheadOfSchedule: User1 has {Required}+ tasks {Days}+ days early (qualify), User2 has {Less} tasks (non-qualify)",
            RequiredCount, DaysAhead, RequiredCount - 1);
    }

    /// <summary>
    /// DeadlineMaster（期限厳守の達人）テストデータ
    /// 条件: 期限付きタスクを10件連続で期限内に完了した
    /// 参照: DeadlineMasterStrategy.cs
    /// </summary>
    private async Task SeedDeadlineMasterTestDataAsync()
    {
        // ===== 判定条件（DeadlineMasterStrategy と同じ値） =====
        const int RequiredStreak = 10;
        // 判定式: CompletedAt.Date <= DueDate.Date が連続 RequiredStreak 件

        var baseDate = DateTimeOffset.UtcNow;

        var tasksByUser = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted && t.CompletedAt != null)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= 15)
            .OrderBy(g => g.Key)
            .Skip(2)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderByDescending(t => t.CompletedAt).Take(15).ToList() })
            .ToListAsync();

        if (tasksByUser.Count < 2)
        {
            _logger.LogWarning("DeadlineMaster: Not enough users with 15+ tasks for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 10件連続で期限内） =====
        var qualifyUser = tasksByUser[0];
        for (int i = 0; i < qualifyUser.Tasks.Count; i++)
        {
            var task = qualifyUser.Tasks[i];
            task.CompletedAt = baseDate.AddDays(-i);
            if (i < 10)
            {
                // 10件: 期限内に完了 → CompletedAt <= DueDate → true
                task.DueDate = baseDate.AddDays(-i + 1);
            }
            else
            {
                // 残り: 期限超過（ストリーク外なので影響なし）
                task.DueDate = baseDate.AddDays(-i - 1);
            }
        }

        // ===== 条件を満たさないユーザー（2人目: 9件目で期限超過） =====
        var nonQualifyUser = tasksByUser[1];
        for (int i = 0; i < nonQualifyUser.Tasks.Count; i++)
        {
            var task = nonQualifyUser.Tasks[i];
            task.CompletedAt = baseDate.AddDays(-i);
            if (i < 8)
            {
                // 8件: 期限内
                task.DueDate = baseDate.AddDays(-i + 1);
            }
            else if (i == 8)
            {
                // 9件目: 期限超過 → ストリーク断絶
                task.DueDate = baseDate.AddDays(-i - 1);
            }
            else
            {
                task.DueDate = baseDate.AddDays(-i + 1);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "DeadlineMaster: User1 has {Required} consecutive on-time (qualify), User2 breaks streak at 9th (non-qualify)",
            RequiredStreak);
    }

    /// <summary>
    /// SpeedStar（スピードスター）テストデータ
    /// 条件: 作成から24時間以内にタスクを完了した（10件以上）
    /// 参照: SpeedStarStrategy.cs
    /// </summary>
    private async Task SeedSpeedStarTestDataAsync()
    {
        // ===== 判定条件（SpeedStarStrategy と同じ値） =====
        const int RequiredCount = 10;
        const int MaxHours = 24;
        // 判定式: (CompletedAt - CreatedAt).TotalHours <= MaxHours, Count >= RequiredCount

        var baseDate = DateTimeOffset.UtcNow;

        var tasksByUser = await _context.WorkspaceTasks
            .Where(t => _targetOrganizationIds.Contains(t.OrganizationId))
            .Where(t => t.IsCompleted && t.CompletedAt != null)
            .GroupBy(t => t.AssignedUserId)
            .Where(g => g.Count() >= 15)
            .OrderBy(g => g.Key)
            .Skip(4)
            .Take(2)
            .Select(g => new { UserId = g.Key, Tasks = g.OrderBy(t => t.Id).Take(15).ToList() })
            .ToListAsync();

        if (tasksByUser.Count < 2)
        {
            _logger.LogWarning("SpeedStar: Not enough users with 15+ tasks for test data");
            return;
        }

        // ===== 条件を満たすユーザー（1人目: 10件が24時間以内） =====
        var qualifyUser = tasksByUser[0];
        for (int i = 0; i < qualifyUser.Tasks.Count; i++)
        {
            var task = qualifyUser.Tasks[i];
            if (i < 10)
            {
                // 10件: 作成から12時間後に完了 → 12 <= 24 → true
                task.CreatedAt = baseDate.AddDays(-10 + i);
                task.CompletedAt = baseDate.AddDays(-10 + i).AddHours(12);
            }
            else
            {
                // 残り: 作成から48時間後に完了 → 48 > 24 → false（カウント外）
                task.CreatedAt = baseDate.AddDays(-10 + i);
                task.CompletedAt = baseDate.AddDays(-10 + i).AddHours(48);
            }
        }

        // ===== 条件を満たさないユーザー（2人目: 9件のみ24時間以内） =====
        var nonQualifyUser = tasksByUser[1];
        for (int i = 0; i < nonQualifyUser.Tasks.Count; i++)
        {
            var task = nonQualifyUser.Tasks[i];
            if (i < 9)
            {
                // 9件: 作成から12時間後に完了 → true だが RequiredCount(10) に満たない
                task.CreatedAt = baseDate.AddDays(-10 + i);
                task.CompletedAt = baseDate.AddDays(-10 + i).AddHours(12);
            }
            else
            {
                // 残り: 作成から48時間後に完了 → false
                task.CreatedAt = baseDate.AddDays(-10 + i);
                task.CompletedAt = baseDate.AddDays(-10 + i).AddHours(48);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "SpeedStar: User1 has {Required}+ tasks within {Hours}h (qualify), User2 has {Less} tasks (non-qualify)",
            RequiredCount, MaxHours, RequiredCount - 1);
    }

    /// <summary>
    /// Century（百人力）テストデータ
    /// 条件: 累計100件のタスクを完了した
    /// 参照: CenturyStrategy.cs
    /// </summary>
    private async Task SeedCenturyTestDataAsync()
    {
        // ===== 判定条件（CenturyStrategy と同じ値） =====
        const int RequiredCount = 100;
        // 判定式: Count(IsCompleted) >= RequiredCount

        // Note: テスト環境で100件のタスクを持つユーザーは少ないため、
        // 実際の判定はログで確認。データ量に依存するため、
        // ここではカウント条件の説明のみ記載
        _logger.LogInformation(
            "Century: Requires {Required}+ completed tasks per user (data-dependent, no modification)",
            RequiredCount);
    }

    /// <summary>
    /// ThousandTasks（千本ノック）テストデータ
    /// 条件: 累計1000件のタスクを完了した
    /// 参照: ThousandTasksStrategy.cs
    /// </summary>
    private async Task SeedThousandTasksTestDataAsync()
    {
        // ===== 判定条件（ThousandTasksStrategy と同じ値） =====
        const int RequiredCount = 1000;
        // 判定式: Count(IsCompleted) >= RequiredCount

        // Note: テスト環境で1000件のタスクを持つユーザーは現実的でないため、
        // 実際の判定はログで確認
        _logger.LogInformation(
            "ThousandTasks: Requires {Required}+ completed tasks per user (data-dependent, no modification)",
            RequiredCount);
    }

    /// <summary>
    /// FirstTry（一発完了）テストデータ
    /// 条件: リオープンされずに完了したタスクが50件以上
    /// 参照: FirstTryStrategy.cs
    /// </summary>
    private async Task SeedFirstTryTestDataAsync()
    {
        // ===== 判定条件（FirstTryStrategy と同じ値） =====
        const int RequiredCount = 50;
        // 判定式: TaskCompleted Activity があり、TaskReopened Activity がない ItemId の数 >= RequiredCount

        var workspaceIds = await _context.Workspaces
            .Where(w => _targetOrganizationIds.Contains(w.OrganizationId))
            .OrderBy(w => w.Id)
            .Select(w => w.Id)
            .Take(5)
            .ToListAsync();

        if (workspaceIds.Count == 0)
        {
            _logger.LogWarning("FirstTry: No workspaces found for test data");
            return;
        }

        // 完了済みタスクの Activity を取得
        var completedActivities = await _context.Activities
            .Where(a => workspaceIds.Contains(a.WorkspaceId))
            .Where(a => a.ActionType == ActivityActionType.TaskCompleted)
            .Where(a => a.UserId != null)
            .OrderBy(a => a.Id)
            .Take(60)
            .ToListAsync();

        if (completedActivities.Count < 55)
        {
            _logger.LogWarning("FirstTry: Not enough TaskCompleted activities for test data");
            return;
        }

        // ===== 条件を満たさないデータ（5件にリオープンを追加） =====
        var itemsToReopen = completedActivities.Take(5).Select(a => a.ItemId).ToList();

        foreach (var itemId in itemsToReopen)
        {
            var baseActivity = completedActivities.First(a => a.ItemId == itemId);
            // TaskReopened Activity を追加 → このタスクは FirstTry 対象外になる
            _context.Activities.Add(new DB.Models.Activity
            {
                WorkspaceId = baseActivity.WorkspaceId,
                ItemId = itemId,
                UserId = baseActivity.UserId,
                ActionType = ActivityActionType.TaskReopened,
                Details = "{}",
                CreatedAt = baseActivity.CreatedAt.AddMinutes(10)
            });
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "FirstTry: Added TaskReopened to 5 tasks (non-qualify), remaining {Required}+ without reopen (qualify if same user)",
            RequiredCount);
    }

    /// <summary>
    /// Veteran（古参ユーザー）テストデータ
    /// 条件: 登録から1年以上経過したユーザー
    /// 参照: VeteranStrategy.cs
    /// </summary>
    private async Task SeedVeteranTestDataAsync()
    {
        // ===== 判定条件（VeteranStrategy と同じ値） =====
        const int RequiredDays = 365;
        // 判定式: (evaluationDate - CreatedAt).Days >= RequiredDays

        var now = DateTimeOffset.UtcNow;

        var users = await _context.Users
            .Where(u => u.OrganizationId != null && _targetOrganizationIds.Contains(u.OrganizationId.Value))
            .Where(u => u.IsActive)
            .OrderBy(u => u.Id)
            .Take(4)
            .ToListAsync();

        if (users.Count < 4)
        {
            _logger.LogWarning("Veteran: Not enough users for test data");
            return;
        }

        // ===== 条件を満たすデータ（2件） =====

        // 400日前に登録 → 400 >= 365 → true（達成）
        users[0].CreatedAt = now.AddDays(-400);

        // 365日前に登録（境界値: ちょうど1年） → 365 >= 365 → true（達成）
        users[1].CreatedAt = now.AddDays(-365);

        // ===== 条件を満たさないデータ（2件） =====

        // 364日前に登録（境界値: 1年未満） → 364 >= 365 → false（未達成）
        users[2].CreatedAt = now.AddDays(-364);

        // 100日前に登録 → 100 >= 365 → false（未達成）
        users[3].CreatedAt = now.AddDays(-100);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Veteran: 2 users registered {Required}+ days ago (qualify), 2 users registered recently (non-qualify)",
            RequiredDays);
    }
}
