namespace Pecus.Libs.WeeklyReport.Models;

/// <summary>
/// ユーザー単位の週間レポートデータ
/// </summary>
public class UserWeeklyReportData
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 組織名
    /// </summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>
    /// 集計対象週の開始日（月曜）
    /// </summary>
    public DateOnly WeekStartDate { get; set; }

    /// <summary>
    /// 集計対象週の終了日（日曜）
    /// </summary>
    public DateOnly WeekEndDate { get; set; }

    /// <summary>
    /// 全員共通: 個人タスクサマリ
    /// </summary>
    public PersonalTaskSummary PersonalSummary { get; set; } = new();

    /// <summary>
    /// オーナー向け: ワークスペース状況一覧（責任アイテムを含む）
    /// null の場合はオーナーではない（Member）
    /// </summary>
    public List<OwnerWorkspaceSummary>? OwnerWorkspaces { get; set; }

    /// <summary>
    /// オーナーセクションを表示するか
    /// </summary>
    public bool HasOwnerSection => OwnerWorkspaces is { Count: > 0 };
}