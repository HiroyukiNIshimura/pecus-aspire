using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Landing;

/// <summary>
/// ランディングページ推奨のスコアリングサービス
/// </summary>
public class LandingPageRecommendationService
{
    /// <summary>
    /// スコアリング結果
    /// </summary>
    public record ScoringResult(
        LandingPage? Recommendation,
        int MyTasksScore,
        int WorkspaceScore,
        int CommitterScore,
        int TotalScore
    );

    /// <summary>
    /// 推奨を提示すべきかどうかを判定するための最小スコア閾値
    /// </summary>
    private const int MinimumScoreThreshold = 10;

    /// <summary>
    /// スコア差がこの割合以下の場合は僅差とみなし、推奨を出さない
    /// </summary>
    private const double CloseMarginRatio = 0.1;

    /// <summary>
    /// 推奨を拒否した後のクールダウン期間（日数）
    /// </summary>
    public const int RefusalCooldownDays = 30;

    /// <summary>
    /// アクティビティのアクション種別ごとのカウントからランディングページを推奨
    /// </summary>
    /// <param name="actionCounts">アクション種別ごとのカウント</param>
    /// <returns>スコアリング結果。推奨なしの場合は Recommendation が null</returns>
    public ScoringResult CalculateRecommendation(IEnumerable<(ActivityActionType ActionType, int Count)> actionCounts)
    {
        var scores = new Dictionary<LandingPage, int>
        {
            { LandingPage.Tasks, 0 },      // MyTasks
            { LandingPage.Workspace, 0 },
            { LandingPage.Committer, 0 }
        };

        foreach (var (actionType, count) in actionCounts)
        {
            switch (actionType)
            {
                // --- マイタスク系 ---
                case ActivityActionType.TaskCompleted:
                    scores[LandingPage.Tasks] += 3 * count; // 完了は強いシグナル
                    break;
                case ActivityActionType.TaskAdded:
                case ActivityActionType.TaskDiscarded:
                case ActivityActionType.TaskReopened:
                    scores[LandingPage.Tasks] += 1 * count;
                    break;

                // --- ワークスペース（編集）系 ---
                case ActivityActionType.Created:
                case ActivityActionType.BodyUpdated:
                case ActivityActionType.FileAdded:
                    scores[LandingPage.Workspace] += 2 * count; // 編集作業は重め
                    break;
                case ActivityActionType.SubjectUpdated:
                case ActivityActionType.FileRemoved:
                case ActivityActionType.RelationAdded:
                case ActivityActionType.RelationRemoved:
                case ActivityActionType.DraftChanged:
                    scores[LandingPage.Workspace] += 1 * count;
                    break;

                // --- コミッター（管理）系 ---
                case ActivityActionType.CommitterChanged:
                case ActivityActionType.AssigneeChanged:
                case ActivityActionType.TaskAssigneeChanged:
                case ActivityActionType.PriorityChanged:
                case ActivityActionType.DueDateChanged:
                case ActivityActionType.TaskDueDateChanged:
                case ActivityActionType.ArchivedChanged:
                    scores[LandingPage.Committer] += 1 * count;
                    break;
            }
        }

        var myTasksScore = scores[LandingPage.Tasks];
        var workspaceScore = scores[LandingPage.Workspace];
        var committerScore = scores[LandingPage.Committer];
        var totalScore = myTasksScore + workspaceScore + committerScore;

        // 最もスコアが高いものを抽出
        var bestMatch = scores.OrderByDescending(x => x.Value).First();

        // データ不足の場合はデフォルト（ダッシュボード）を維持 → 推奨なし
        if (bestMatch.Value < MinimumScoreThreshold)
        {
            return new ScoringResult(null, myTasksScore, workspaceScore, committerScore, totalScore);
        }

        // 僅差判定: 2位との差がトップスコアの10%以下なら推奨しない
        var sortedScores = scores.OrderByDescending(x => x.Value).ToList();
        if (sortedScores.Count >= 2)
        {
            var topScore = sortedScores[0].Value;
            var secondScore = sortedScores[1].Value;
            var margin = topScore - secondScore;

            if (topScore > 0 && (double)margin / topScore <= CloseMarginRatio)
            {
                return new ScoringResult(null, myTasksScore, workspaceScore, committerScore, totalScore);
            }
        }

        return new ScoringResult(bestMatch.Key, myTasksScore, workspaceScore, committerScore, totalScore);
    }

    /// <summary>
    /// 推奨を提示すべきかどうかを判定
    /// </summary>
    /// <param name="currentLandingPage">現在の設定値</param>
    /// <param name="recommendation">推奨値</param>
    /// <param name="landingPageUpdatedAt">ユーザーが最後に設定を変更した日時</param>
    /// <param name="recommendationRefusedAt">ユーザーが推奨を拒否した日時</param>
    /// <returns>推奨を提示すべき場合は true</returns>
    public bool ShouldPresentRecommendation(
        LandingPage? currentLandingPage,
        LandingPage? recommendation,
        DateTimeOffset? landingPageUpdatedAt,
        DateTimeOffset? recommendationRefusedAt)
    {
        // 推奨値がない場合は提示しない
        if (recommendation == null)
        {
            return false;
        }

        // 現在の設定と同じ場合は提示しない
        var effectiveCurrent = currentLandingPage ?? LandingPage.Dashboard;
        if (effectiveCurrent == recommendation)
        {
            return false;
        }

        var now = DateTimeOffset.UtcNow;

        // 設定変更直後（7日以内）は提示しない
        if (landingPageUpdatedAt.HasValue)
        {
            var daysSinceUpdate = (now - landingPageUpdatedAt.Value).TotalDays;
            if (daysSinceUpdate < 7)
            {
                return false;
            }
        }

        // 拒否後のクールダウン期間内は提示しない
        if (recommendationRefusedAt.HasValue)
        {
            var daysSinceRefusal = (now - recommendationRefusedAt.Value).TotalDays;
            if (daysSinceRefusal < RefusalCooldownDays)
            {
                return false;
            }
        }

        return true;
    }

    /// <summary>
    /// ランディングページの表示名を取得
    /// </summary>
    public static string GetLandingPageDisplayName(LandingPage landingPage)
    {
        return landingPage switch
        {
            LandingPage.Dashboard => "ダッシュボード",
            LandingPage.Workspace => "ワークスペース",
            LandingPage.MyItems => "マイアイテム",
            LandingPage.Tasks => "マイタスク",
            LandingPage.Committer => "コミッター",
            _ => landingPage.ToString()
        };
    }
}
