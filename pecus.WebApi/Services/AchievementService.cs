using Microsoft.EntityFrameworkCore;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Services;

/// <summary>
/// 難易度別のスコア重み（指数的）
/// </summary>
internal static class DifficultyScoreWeights
{
    public static int GetScore(AchievementDifficulty difficulty) => difficulty switch
    {
        AchievementDifficulty.Easy => 1,
        AchievementDifficulty.Medium => 2,
        AchievementDifficulty.Hard => 4,
        _ => 1
    };
}

/// <summary>
/// 実績（Achievement）関連のサービス
/// </summary>
/// <remarks>
/// ユーザーの実績取得、コレクション一覧、通知済みマーク、ランキングなどを管理します。
/// </remarks>
public class AchievementService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AchievementService> _logger;

    public AchievementService(
        ApplicationDbContext context,
        ILogger<AchievementService> logger
    )
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 全実績マスタをユーザーの取得状況付きで取得（コレクションページ用）
    /// </summary>
    /// <param name="userId">対象ユーザーID</param>
    /// <returns>実績コレクションレスポンスのリスト</returns>
    public async Task<List<AchievementCollectionResponse>> GetAchievementCollectionAsync(int userId)
    {
        var achievements = await _context.AchievementMasters
            .Where(a => a.IsActive)
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Id)
            .Select(a => new
            {
                Master = a,
                UserAchievement = _context.UserAchievements
                    .FirstOrDefault(ua => ua.AchievementMasterId == a.Id && ua.UserId == userId)
            })
            .ToListAsync();

        return achievements.Select(a =>
        {
            var isEarned = a.UserAchievement != null && a.UserAchievement.IsNotified;

            return new AchievementCollectionResponse
            {
                Id = a.Master.Id,
                Code = a.Master.Code,
                Name = isEarned ? a.Master.Name : "???",
                NameEn = isEarned ? a.Master.NameEn : "???",
                Description = isEarned ? a.Master.Description : "???",
                DescriptionEn = isEarned ? a.Master.DescriptionEn : "???",
                IconPath = isEarned ? a.Master.IconPath : null,
                Difficulty = a.Master.Difficulty,
                Category = a.Master.Category,
                IsEarned = isEarned,
                EarnedAt = a.UserAchievement?.EarnedAt
            };
        }).ToList();
    }

    /// <summary>
    /// 自分の取得済み実績を取得
    /// </summary>
    /// <param name="userId">対象ユーザーID</param>
    /// <returns>ユーザー実績レスポンスのリスト</returns>
    public async Task<List<UserAchievementResponse>> GetOwnAchievementsAsync(int userId)
    {
        return await _context.UserAchievements
            .Where(ua => ua.UserId == userId && ua.IsNotified)
            .Include(ua => ua.AchievementMaster)
            .Where(ua => ua.AchievementMaster != null && ua.AchievementMaster.IsActive)
            .OrderByDescending(ua => ua.EarnedAt)
            .Select(ua => new UserAchievementResponse
            {
                Id = ua.AchievementMaster!.Id,
                Code = ua.AchievementMaster.Code,
                Name = ua.AchievementMaster.Name,
                NameEn = ua.AchievementMaster.NameEn,
                Description = ua.AchievementMaster.Description,
                DescriptionEn = ua.AchievementMaster.DescriptionEn,
                IconPath = ua.AchievementMaster.IconPath,
                Difficulty = ua.AchievementMaster.Difficulty,
                Category = ua.AchievementMaster.Category,
                EarnedAt = ua.EarnedAt
            })
            .ToListAsync();
    }

    /// <summary>
    /// 指定ユーザーの取得済み実績を取得（公開範囲を考慮）
    /// </summary>
    /// <param name="targetUserId">対象ユーザーID</param>
    /// <param name="requestUserId">リクエストユーザーID</param>
    /// <param name="requestUserOrganizationId">リクエストユーザーの組織ID</param>
    /// <returns>ユーザー実績レスポンスのリスト（公開範囲外の場合は空リスト）</returns>
    public async Task<List<UserAchievementResponse>> GetUserAchievementsAsync(
        int targetUserId,
        int requestUserId,
        int requestUserOrganizationId)
    {
        if (targetUserId == requestUserId)
        {
            return await GetOwnAchievementsAsync(targetUserId);
        }

        var targetUser = await _context.Users
            .Include(u => u.Setting)
            .Include(u => u.Organization)
            .ThenInclude(o => o!.Setting)
            .FirstOrDefaultAsync(u => u.Id == targetUserId && u.IsActive);

        if (targetUser == null)
        {
            return new List<UserAchievementResponse>();
        }

        var organizationSetting = targetUser.Organization?.Setting;
        if (organizationSetting == null || !organizationSetting.GamificationEnabled)
        {
            return new List<UserAchievementResponse>();
        }

        var effectiveVisibility = GetEffectiveVisibility(
            targetUser.Setting?.BadgeVisibility,
            organizationSetting.GamificationBadgeVisibility,
            organizationSetting.GamificationAllowUserOverride
        );

        var hasAccess = await CheckVisibilityAccessAsync(
            effectiveVisibility,
            targetUserId,
            requestUserId,
            requestUserOrganizationId,
            targetUser.OrganizationId
        );

        if (!hasAccess)
        {
            return new List<UserAchievementResponse>();
        }

        return await _context.UserAchievements
            .Where(ua => ua.UserId == targetUserId && ua.IsNotified)
            .Include(ua => ua.AchievementMaster)
            .Where(ua => ua.AchievementMaster != null && ua.AchievementMaster.IsActive)
            .OrderByDescending(ua => ua.EarnedAt)
            .Select(ua => new UserAchievementResponse
            {
                Id = ua.AchievementMaster!.Id,
                Code = ua.AchievementMaster.Code,
                Name = ua.AchievementMaster.Name,
                NameEn = ua.AchievementMaster.NameEn,
                Description = ua.AchievementMaster.Description,
                DescriptionEn = ua.AchievementMaster.DescriptionEn,
                IconPath = ua.AchievementMaster.IconPath,
                Difficulty = ua.AchievementMaster.Difficulty,
                Category = ua.AchievementMaster.Category,
                EarnedAt = ua.EarnedAt
            })
            .ToListAsync();
    }

    /// <summary>
    /// 未通知の実績を取得
    /// </summary>
    /// <param name="userId">対象ユーザーID</param>
    /// <returns>未通知の実績レスポンスのリスト</returns>
    public async Task<List<NewAchievementResponse>> GetUnnotifiedAchievementsAsync(int userId)
    {
        return await _context.UserAchievements
            .Where(ua => ua.UserId == userId && !ua.IsNotified)
            .Include(ua => ua.AchievementMaster)
            .Where(ua => ua.AchievementMaster != null && ua.AchievementMaster.IsActive)
            .OrderBy(ua => ua.EarnedAt)
            .Select(ua => new NewAchievementResponse
            {
                Id = ua.AchievementMaster!.Id,
                Code = ua.AchievementMaster.Code,
                Name = ua.AchievementMaster.Name,
                NameEn = ua.AchievementMaster.NameEn,
                Description = ua.AchievementMaster.Description,
                DescriptionEn = ua.AchievementMaster.DescriptionEn,
                IconPath = ua.AchievementMaster.IconPath,
                Difficulty = ua.AchievementMaster.Difficulty,
                Category = ua.AchievementMaster.Category,
                EarnedAt = ua.EarnedAt
            })
            .ToListAsync();
    }

    /// <summary>
    /// 実績を通知済みにマーク
    /// </summary>
    /// <param name="userId">対象ユーザーID</param>
    /// <param name="achievementId">実績マスタID</param>
    /// <returns>成功した場合は true</returns>
    public async Task<bool> MarkAsNotifiedAsync(int userId, int achievementId)
    {
        var userAchievement = await _context.UserAchievements
            .FirstOrDefaultAsync(ua => ua.UserId == userId && ua.AchievementMasterId == achievementId);

        if (userAchievement == null)
        {
            _logger.LogWarning(
                "通知済みマーク失敗: ユーザー実績が見つかりません。UserId: {UserId}, AchievementId: {AchievementId}",
                userId,
                achievementId
            );
            return false;
        }

        if (userAchievement.IsNotified)
        {
            return true;
        }

        userAchievement.IsNotified = true;
        userAchievement.NotifiedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "実績を通知済みにマークしました。UserId: {UserId}, AchievementId: {AchievementId}",
            userId,
            achievementId
        );

        return true;
    }

    /// <summary>
    /// 全ての未通知実績を通知済みにマーク（一括処理用）
    /// </summary>
    /// <param name="userId">対象ユーザーID</param>
    /// <returns>マークした件数</returns>
    public async Task<int> MarkAllAsNotifiedAsync(int userId)
    {
        var unnotifiedAchievements = await _context.UserAchievements
            .Where(ua => ua.UserId == userId && !ua.IsNotified)
            .ToListAsync();

        if (unnotifiedAchievements.Count == 0)
        {
            return 0;
        }

        var now = DateTimeOffset.UtcNow;
        foreach (var ua in unnotifiedAchievements)
        {
            ua.IsNotified = true;
            ua.NotifiedAt = now;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "全ての未通知実績を通知済みにマークしました。UserId: {UserId}, Count: {Count}",
            userId,
            unnotifiedAchievements.Count
        );

        return unnotifiedAchievements.Count;
    }

    /// <summary>
    /// 有効な公開範囲を決定
    /// </summary>
    private static BadgeVisibility GetEffectiveVisibility(
        BadgeVisibility? userVisibility,
        BadgeVisibility organizationVisibility,
        bool allowUserOverride)
    {
        if (!allowUserOverride || userVisibility == null)
        {
            return organizationVisibility;
        }

        return (BadgeVisibility)Math.Min((int)userVisibility.Value, (int)organizationVisibility);
    }

    /// <summary>
    /// 公開範囲に基づきアクセス可否を判定
    /// </summary>
    private async Task<bool> CheckVisibilityAccessAsync(
        BadgeVisibility visibility,
        int targetUserId,
        int requestUserId,
        int requestUserOrganizationId,
        int? targetUserOrganizationId)
    {
        switch (visibility)
        {
            case BadgeVisibility.Private:
                return false;

            case BadgeVisibility.Organization:
                return requestUserOrganizationId == targetUserOrganizationId;

            case BadgeVisibility.Workspace:
                if (requestUserOrganizationId != targetUserOrganizationId)
                {
                    return false;
                }
                return await _context.WorkspaceUsers
                    .AnyAsync(wm1 =>
                        wm1.UserId == targetUserId &&
                        _context.WorkspaceUsers.Any(wm2 =>
                            wm2.WorkspaceId == wm1.WorkspaceId &&
                            wm2.UserId == requestUserId
                        )
                    );

            default:
                return false;
        }
    }

    /// <summary>
    /// バッジ獲得ランキングを取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspaceId">ワークスペースID（null の場合は組織全体）</param>
    /// <param name="topN">取得件数（デフォルト: 3）</param>
    /// <returns>ランキングレスポンス（組織設定により空の場合あり）</returns>
    public async Task<AchievementRankingResponse> GetRankingAsync(
        int organizationId,
        int? workspaceId = null,
        int topN = 3)
    {
        // 組織設定を取得してランキング表示可否をチェック
        var orgSetting = await _context.OrganizationSettings
            .FirstOrDefaultAsync(os => os.OrganizationId == organizationId);

        // Gamification が無効の場合は空を返す
        if (orgSetting == null || !orgSetting.GamificationEnabled)
        {
            return new AchievementRankingResponse
            {
                DifficultyRanking = [],
                CountRanking = [],
                GrowthRanking = []
            };
        }

        // GamificationBadgeVisibility に基づく表示制御
        // - ダッシュボード（workspaceId = null）: Organization の場合のみ表示
        // - ワークスペース（workspaceId != null）: Organization または Workspace の場合のみ表示
        var visibility = orgSetting.GamificationBadgeVisibility;
        if (workspaceId == null)
        {
            // ダッシュボード: Organization のみ許可
            if (visibility != BadgeVisibility.Organization)
            {
                return new AchievementRankingResponse
                {
                    DifficultyRanking = [],
                    CountRanking = [],
                    GrowthRanking = []
                };
            }
        }
        else
        {
            // ワークスペース: Organization または Workspace のみ許可
            if (visibility == BadgeVisibility.Private)
            {
                return new AchievementRankingResponse
                {
                    DifficultyRanking = [],
                    CountRanking = [],
                    GrowthRanking = []
                };
            }
        }

        // 対象ユーザーを取得（GetEffectiveVisibility と CheckVisibilityAccessAsync の要件に準拠）
        // 組織設定を取得
        var allowUserOverride = orgSetting.GamificationAllowUserOverride;
        var orgVisibility = orgSetting.GamificationBadgeVisibility;

        // 対象ユーザーを取得
        var candidateUsers = await _context.Users
            .Where(u => u.IsActive && u.OrganizationId == organizationId)
            .Include(u => u.Setting)
            .ToListAsync();

        // ワークスペース指定時はワークスペースメンバーのみ対象
        if (workspaceId.HasValue)
        {
            var workspaceUserIds = await _context.WorkspaceUsers
                .Where(wu => wu.WorkspaceId == workspaceId.Value)
                .Select(wu => wu.UserId)
                .ToListAsync();

            candidateUsers = candidateUsers
                .Where(u => workspaceUserIds.Contains(u.Id))
                .ToList();
        }

        // GetEffectiveVisibility と CheckVisibilityAccessAsync の要件に基づきフィルタ
        var targetUserIds = new List<int>();
        foreach (var user in candidateUsers)
        {
            var effectiveVisibility = GetEffectiveVisibility(
                user.Setting?.BadgeVisibility,
                orgVisibility,
                allowUserOverride
            );

            // CheckVisibilityAccessAsync の要件に従う判定
            // - Private: 常に非表示
            // - Organization: 組織全体で表示 → ダッシュボードとワークスペース両方で表示可
            // - Workspace: 同じワークスペースのメンバーにのみ表示 → ワークスペース指定時のみ表示可
            var canShow = effectiveVisibility switch
            {
                BadgeVisibility.Private => false,
                BadgeVisibility.Organization => true,
                BadgeVisibility.Workspace => workspaceId.HasValue, // ワークスペース指定時のみ表示
                _ => false
            };

            if (canShow)
            {
                targetUserIds.Add(user.Id);
            }
        }

        if (targetUserIds.Count == 0)
        {
            return new AchievementRankingResponse
            {
                DifficultyRanking = [],
                CountRanking = [],
                GrowthRanking = []
            };
        }

        // ユーザーごとの実績データを取得（通知済みのみ）
        var userAchievements = await _context.UserAchievements
            .Where(ua => targetUserIds.Contains(ua.UserId) && ua.IsNotified)
            .Include(ua => ua.AchievementMaster)
            .Include(ua => ua.User)
            .Where(ua => ua.AchievementMaster != null && ua.AchievementMaster.IsActive)
            .ToListAsync();

        // ユーザーごとに集計
        var userStats = userAchievements
            .GroupBy(ua => ua.UserId)
            .Select(g =>
            {
                var user = g.First().User!;
                var achievements = g.ToList();
                var badgeCount = achievements.Count;

                // 難易度スコア（指数的重み付け）
                var difficultyScore = achievements.Sum(ua =>
                    DifficultyScoreWeights.GetScore(ua.AchievementMaster!.Difficulty));

                // 成長速度スコア計算
                // 最初のバッジ取得日〜最新バッジ取得日の期間
                var firstEarned = achievements.Min(ua => ua.EarnedAt);
                var lastEarned = achievements.Max(ua => ua.EarnedAt);
                var activeDays = Math.Max(1, (lastEarned - firstEarned).Days + 1);
                var growthScore = badgeCount >= 2
                    ? Math.Round((decimal)badgeCount / activeDays * 100, 2)
                    : 0m; // バッジ1個以下は成長速度計算対象外

                return new
                {
                    UserId = user.Id,
                    UserLoginId = user.LoginId,
                    DisplayName = user.Username,
                    AvatarUrl = IdentityIconHelper.GetIdentityIconUrl(
                        user.AvatarType,
                        user.Id,
                        user.Username,
                        user.Email,
                        user.UserAvatarPath,
                        80
                    ),
                    BadgeCount = badgeCount,
                    DifficultyScore = difficultyScore,
                    GrowthScore = growthScore
                };
            })
            .ToList();

        // 難易度ランキング
        var difficultyRanking = userStats
            .Where(u => u.DifficultyScore > 0)
            .OrderByDescending(u => u.DifficultyScore)
            .ThenByDescending(u => u.BadgeCount)
            .Take(topN)
            .Select((u, index) => new RankingItemDto
            {
                Rank = index + 1,
                UserInternalId = u.UserId,
                UserId = u.UserLoginId,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl,
                Score = u.DifficultyScore,
                BadgeCount = u.BadgeCount
            })
            .ToList();

        // 取得数ランキング
        var countRanking = userStats
            .Where(u => u.BadgeCount > 0)
            .OrderByDescending(u => u.BadgeCount)
            .ThenByDescending(u => u.DifficultyScore)
            .Take(topN)
            .Select((u, index) => new RankingItemDto
            {
                Rank = index + 1,
                UserInternalId = u.UserId,
                UserId = u.UserLoginId,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl,
                Score = u.BadgeCount,
                BadgeCount = u.BadgeCount
            })
            .ToList();

        // 成長速度ランキング（バッジ2個以上取得者のみ）
        var growthRanking = userStats
            .Where(u => u.GrowthScore > 0)
            .OrderByDescending(u => u.GrowthScore)
            .ThenByDescending(u => u.BadgeCount)
            .Take(topN)
            .Select((u, index) => new RankingItemDto
            {
                Rank = index + 1,
                UserInternalId = u.UserId,
                UserId = u.UserLoginId,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl,
                Score = u.GrowthScore,
                BadgeCount = u.BadgeCount
            })
            .ToList();

        return new AchievementRankingResponse
        {
            DifficultyRanking = difficultyRanking,
            CountRanking = countRanking,
            GrowthRanking = growthRanking
        };
    }
}
