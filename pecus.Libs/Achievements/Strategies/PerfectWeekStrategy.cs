using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;

namespace Pecus.Libs.Achievements.Strategies;

/// <summary>
/// パーフェクトウィーク - 1週間で全タスクを期限内に完了した（最低5件以上）
/// </summary>
public class PerfectWeekStrategy : AchievementStrategyBase
{
    private const int MinimumTasks = 5;
    private const string DefaultTimeZone = "Asia/Tokyo";

    /// <summary>
    /// <see cref="PerfectWeekStrategy"/> クラスの新しいインスタンスを初期化します。
    /// </summary>
    /// <param name="context">データベースコンテキスト。</param>
    /// <param name="logger">ロガー。</param>
    public PerfectWeekStrategy(ApplicationDbContext context, ILogger<PerfectWeekStrategy> logger)
        : base(context, logger)
    {
    }

    /// <inheritdoc/>
    public override string AchievementCode => "PERFECT_WEEK";

    /// <inheritdoc/>
    /// <remarks>
    /// 過去全期間を対象に、週単位で評価します。いずれかの週で条件を満たしていればバッジ獲得対象です。
    /// 既にバッジを獲得しているユーザーの除外は AchievementEvaluator が担当します。
    /// </remarks>
    public override async Task<IEnumerable<int>> EvaluateAsync(
        int organizationId,
        DateTimeOffset evaluationDate,
        CancellationToken cancellationToken = default)
    {
        // 過去全期間の完了タスクを取得
        var allCompletions = await Context.WorkspaceTasks
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .Where(t => t.IsCompleted)
            .Where(t => t.CompletedAt != null)
            .Where(t => t.CompletedByUserId != null)
            .Select(t => new
            {
                CompletedByUserId = t.CompletedByUserId!.Value,
                CompletedAt = t.CompletedAt!.Value,
                t.DueDate
            })
            .ToListAsync(cancellationToken);

        var qualifiedUsers = new List<int>();

        foreach (var userGroup in allCompletions.GroupBy(c => c.CompletedByUserId))
        {
            // 週番号でグループ化（ISOウィーク）
            var weekGroups = userGroup.GroupBy(c =>
            {
                var localDate = ConvertToLocalTime(c.CompletedAt, DefaultTimeZone).Date;
                // 月曜始まりの週番号を計算
                var daysToMonday = ((int)localDate.DayOfWeek + 6) % 7;
                var weekStart = localDate.AddDays(-daysToMonday);
                return weekStart;
            });

            // いずれかの週で条件を満たしているか
            foreach (var weekGroup in weekGroups)
            {
                var weekCompletions = weekGroup.ToList();
                var weekStart = weekGroup.Key;
                var weekEnd = weekStart.AddDays(7);

                // 週内の完了タスクのみを抽出
                var validCompletions = weekCompletions
                    .Where(c =>
                    {
                        var localCompletedDate = ConvertToLocalTime(c.CompletedAt, DefaultTimeZone).Date;
                        return localCompletedDate >= weekStart && localCompletedDate < weekEnd;
                    })
                    .ToList();

                // 期限内判定はローカル時刻（JST）での日付で比較
                if (validCompletions.Count >= MinimumTasks &&
                    validCompletions.All(c =>
                    {
                        var localCompletedDate = ConvertToLocalTime(c.CompletedAt, DefaultTimeZone).Date;
                        var localDueDate = ConvertToLocalTime(c.DueDate, DefaultTimeZone).Date;
                        return localCompletedDate <= localDueDate;
                    }))
                {
                    qualifiedUsers.Add(userGroup.Key);
                    break; // このユーザーは条件達成、次のユーザーへ
                }
            }
        }

        Logger.LogDebug(
            "PerfectWeek evaluation for org {OrganizationId}: {Count} users qualified",
            organizationId,
            qualifiedUsers.Count);

        return qualifiedUsers.Take(MaxResultsPerEvaluation);
    }
}
