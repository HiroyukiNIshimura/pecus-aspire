using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Libs.Achievements;

/// <summary>
/// 全Strategyを実行して実績を評価するサービス
/// </summary>
public class AchievementEvaluator
{
    private readonly ApplicationDbContext _context;
    private readonly IEnumerable<IAchievementStrategy> _strategies;
    private readonly ILogger<AchievementEvaluator> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="context">データベースコンテキスト</param>
    /// <param name="strategies">登録されている全Strategy</param>
    /// <param name="logger">ロガー</param>
    public AchievementEvaluator(
        ApplicationDbContext context,
        IEnumerable<IAchievementStrategy> strategies,
        ILogger<AchievementEvaluator> logger)
    {
        _context = context;
        _strategies = strategies;
        _logger = logger;
    }

    /// <summary>
    /// 指定組織の全ユーザーに対して実績判定を実行
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>新規獲得した実績の件数</returns>
    public async Task<int> EvaluateOrganizationAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        var evaluationDate = DateTimeOffset.UtcNow;
        var totalNewAchievements = 0;

        // 有効な実績マスタを取得（Codeでインデックス化）
        var activeMasters = await _context.AchievementMasters
            .Where(m => m.IsActive)
            .ToDictionaryAsync(m => m.Code, cancellationToken);

        // 既存の獲得済み実績を取得（重複チェック用）
        var existingAchievements = await _context.UserAchievements
            .Where(ua => ua.OrganizationId == organizationId)
            .Select(ua => new { ua.UserId, ua.AchievementMaster!.Code })
            .ToListAsync(cancellationToken);

        var existingSet = existingAchievements
            .Select(x => (x.UserId, x.Code))
            .ToHashSet();

        _logger.LogInformation(
            "Starting achievement evaluation for organization {OrganizationId} with {StrategyCount} strategies",
            organizationId, _strategies.Count());

        foreach (var strategy in _strategies)
        {
            if (!activeMasters.TryGetValue(strategy.AchievementCode, out var master))
            {
                _logger.LogWarning(
                    "Strategy {StrategyCode} has no matching active AchievementMaster",
                    strategy.AchievementCode);
                continue;
            }

            try
            {
                var achievedUserIds = await strategy.EvaluateAsync(
                    organizationId, evaluationDate, cancellationToken);

                var newAchievements = new List<UserAchievement>();

                foreach (var userId in achievedUserIds)
                {
                    // 重複チェック
                    if (existingSet.Contains((userId, strategy.AchievementCode)))
                    {
                        continue;
                    }

                    newAchievements.Add(new UserAchievement
                    {
                        UserId = userId,
                        AchievementMasterId = master.Id,
                        OrganizationId = organizationId,
                        EarnedAt = evaluationDate,
                        IsNotified = false,
                        IsMainBadge = false
                    });

                    // 重複チェック用セットにも追加
                    existingSet.Add((userId, strategy.AchievementCode));
                }

                if (newAchievements.Count > 0)
                {
                    // 重複エラーを回避するため、SaveChanges前に再度DBをチェック
                    var userIdsToAdd = newAchievements.Select(a => a.UserId).ToList();
                    var alreadyExists = await _context.UserAchievements
                        .Where(ua => ua.AchievementMasterId == master.Id)
                        .Where(ua => userIdsToAdd.Contains(ua.UserId))
                        .Select(ua => ua.UserId)
                        .ToListAsync(cancellationToken);

                    // 既に存在するユーザーを除外
                    newAchievements = newAchievements
                        .Where(a => !alreadyExists.Contains(a.UserId))
                        .ToList();

                    if (newAchievements.Count > 0)
                    {
                        await _context.UserAchievements.AddRangeAsync(newAchievements, cancellationToken);
                        await _context.SaveChangesAsync(cancellationToken);
                        totalNewAchievements += newAchievements.Count;

                        _logger.LogInformation(
                            "Strategy {StrategyCode} awarded {Count} new achievements",
                            strategy.AchievementCode, newAchievements.Count);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error evaluating strategy {StrategyCode} for organization {OrganizationId}",
                    strategy.AchievementCode, organizationId);
            }
        }

        _logger.LogInformation(
            "Achievement evaluation completed for organization {OrganizationId}. Total new achievements: {Count}",
            organizationId, totalNewAchievements);

        return totalNewAchievements;
    }

    /// <summary>
    /// 特定のStrategyのみを実行
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="achievementCode">実績コード</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>新規獲得した実績の件数</returns>
    public async Task<int> EvaluateSingleStrategyAsync(
        int organizationId,
        string achievementCode,
        CancellationToken cancellationToken = default)
    {
        var strategy = _strategies.FirstOrDefault(s => s.AchievementCode == achievementCode);
        if (strategy == null)
        {
            _logger.LogWarning("Strategy not found for code: {Code}", achievementCode);
            return 0;
        }

        var master = await _context.AchievementMasters
            .FirstOrDefaultAsync(m => m.Code == achievementCode && m.IsActive, cancellationToken);

        if (master == null)
        {
            _logger.LogWarning("Active AchievementMaster not found for code: {Code}", achievementCode);
            return 0;
        }

        var evaluationDate = DateTimeOffset.UtcNow;
        var achievedUserIds = await strategy.EvaluateAsync(organizationId, evaluationDate, cancellationToken);

        // 既存の獲得済み実績を取得
        var existingUserIds = await _context.UserAchievements
            .Where(ua => ua.OrganizationId == organizationId && ua.AchievementMasterId == master.Id)
            .Select(ua => ua.UserId)
            .ToHashSetAsync(cancellationToken);

        var newAchievements = achievedUserIds
            .Where(userId => !existingUserIds.Contains(userId))
            .Select(userId => new UserAchievement
            {
                UserId = userId,
                AchievementMasterId = master.Id,
                OrganizationId = organizationId,
                EarnedAt = evaluationDate,
                IsNotified = false,
                IsMainBadge = false
            })
            .ToList();

        if (newAchievements.Count > 0)
        {
            await _context.UserAchievements.AddRangeAsync(newAchievements, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return newAchievements.Count;
    }
}