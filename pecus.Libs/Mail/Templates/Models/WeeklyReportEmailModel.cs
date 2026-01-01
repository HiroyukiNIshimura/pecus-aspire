using Pecus.Libs.WeeklyReport.Models;

namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// 週間レポートメールテンプレート用モデル
/// </summary>
public class WeeklyReportEmailModel : EmailTemplateModelBase, IEmailTemplateModel<WeeklyReportEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "weekly-report";

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

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
    /// 個人タスクサマリ
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

    /// <summary>
    /// ダッシュボードURL
    /// </summary>
    public string DashboardUrl { get; set; } = string.Empty;
}
