using Microsoft.Extensions.Logging;

namespace Pecus.Libs.DB.Seed.Atoms;

/// <summary>
/// Achievement テストデータ生成（DeveloperAtoms の partial）
/// エントリポイント + 共通ヘルパー
/// </summary>
/// <remarks>
/// 各カテゴリの実装は以下のファイルに分割:
/// - DeveloperAtoms.Achievements.Time.cs    : 時間系（EarlyBird, NightOwl, WeekendGuardian）
/// - DeveloperAtoms.Achievements.Task.cs    : タスク完了系（AheadOfSchedule, etc）
/// - DeveloperAtoms.Achievements.Quality.cs : 品質系（DeadlineMaster, SpeedStar, etc）
/// - DeveloperAtoms.Achievements.Social.cs  : ソーシャル系（Connector, BestSupporting, etc）
/// </remarks>
public partial class DeveloperAtoms
{
    /// <summary>
    /// Achievement テストデータを投入
    /// 各Strategy の条件を満たす/満たさないデータを作成
    /// </summary>
    public async Task SeedAchievementTestDataAsync()
    {
        _logger.LogInformation("Seeding achievement test data...");

        // 時間系
        await SeedEarlyBirdTestDataAsync();
        await SeedNightOwlTestDataAsync();
        await SeedWeekendGuardianTestDataAsync();

        // タスク完了系
        await SeedAheadOfScheduleTestDataAsync();
        await SeedDeadlineMasterTestDataAsync();
        await SeedSpeedStarTestDataAsync();
        await SeedCenturyTestDataAsync();
        await SeedThousandTasksTestDataAsync();
        await SeedFirstTryTestDataAsync();
        await SeedVeteranTestDataAsync();

        // 品質系
        await SeedEstimationWizardTestDataAsync();
        await SeedPriorityHunterTestDataAsync();
        await SeedMultitaskerTestDataAsync();
        await SeedSteadyHandTestDataAsync();
        await SeedStreakMasterTestDataAsync();
        await SeedPerfectWeekTestDataAsync();
        await SeedInboxZeroTestDataAsync();

        // ソーシャル系
        await SeedPromiseKeeperTestDataAsync();
        await SeedSaviorTestDataAsync();
        await SeedTaskChefTestDataAsync();
        await SeedConnectorTestDataAsync();
        await SeedBestSupportingTestDataAsync();
        await SeedCommentatorTestDataAsync();
        await SeedDocumenterTestDataAsync();
        await SeedEvidenceKeeperTestDataAsync();
        await SeedAiApprenticeTestDataAsync();
        await SeedLearnerTestDataAsync();
        await SeedUnsungHeroTestDataAsync();

        _logger.LogInformation("Achievement test data seeding completed");
    }

    /// <summary>
    /// JST のローカル時刻を UTC に変換
    /// </summary>
    private static DateTimeOffset ToJstUtc(DateTime date, int hour, int minute, TimeZoneInfo tz)
    {
        var local = new DateTime(date.Year, date.Month, date.Day, hour, minute, 0, DateTimeKind.Unspecified);
        var offset = tz.GetUtcOffset(local);
        return new DateTimeOffset(local, offset).ToUniversalTime();
    }
}
