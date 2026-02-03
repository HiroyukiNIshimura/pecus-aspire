namespace Pecus.Libs.Utils;

/// <summary>
/// ユーザーの負荷レベル計算ユーティリティ
/// </summary>
public static class WorkloadCalculator
{
    /// <summary>
    /// 負荷レベルを計算
    /// </summary>
    /// <param name="overdueCount">期限切れタスク数</param>
    /// <param name="dueTodayCount">今日期限のタスク数</param>
    /// <param name="dueThisWeekCount">今週期限のタスク数</param>
    /// <param name="activeWorkspaceCount">アクティブなワークスペース数</param>
    /// <returns>負荷レベル文字列（"Low", "Medium", "High", "Overloaded"）</returns>
    public static string CalculateWorkloadLevel(
        int overdueCount,
        int dueTodayCount,
        int dueThisWeekCount,
        int activeWorkspaceCount)
    {
        // 期限切れがあれば即「過負荷」
        if (overdueCount > 0) return "Overloaded";

        // スコア計算（重み付け）
        var score =
            dueThisWeekCount * 2 +       // 今週のタスク数
            dueTodayCount * 3 +           // 今日期限（緊急）
            activeWorkspaceCount * 1.5;   // コンテキストスイッチ

        if (score >= 15) return "High";
        if (score >= 8) return "Medium";
        return "Low";
    }
}
