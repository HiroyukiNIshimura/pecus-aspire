using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Mail.Services;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;
using Pecus.Libs.WeeklyReport;
using Pecus.Libs.WeeklyReport.Models;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// 週間レポート関連の Hangfire タスク
/// </summary>
public class WeeklyReportTasks
{
    private readonly ILogger<WeeklyReportTasks> _logger;
    private readonly ApplicationDbContext _dbContext;
    private readonly WeeklyReportDataCollector _dataCollector;
    private readonly IEmailService _emailService;
    private readonly FrontendUrlResolver _frontendUrlResolver;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="logger">ロガー</param>
    /// <param name="dbContext">DBコンテキスト</param>
    /// <param name="dataCollector">データ収集サービス</param>
    /// <param name="emailService">メール送信サービス</param>
    /// <param name="frontendUrlResolver">フロントエンドURL解決</param>
    public WeeklyReportTasks(
        ILogger<WeeklyReportTasks> logger,
        ApplicationDbContext dbContext,
        WeeklyReportDataCollector dataCollector,
        IEmailService emailService,
        FrontendUrlResolver frontendUrlResolver)
    {
        _logger = logger;
        _dbContext = dbContext;
        _dataCollector = dataCollector;
        _emailService = emailService;
        _frontendUrlResolver = frontendUrlResolver;
    }

    /// <summary>
    /// 毎日実行: 今日が配信日の組織を検出し、レポート生成ジョブをキューに追加
    /// </summary>
    public async Task CheckAndDispatchWeeklyReportsAsync()
    {
        _logger.LogInformation("WeeklyReport: Checking organizations for today's delivery...");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayDayOfWeek = (int)today.DayOfWeek;
        // DayOfWeek: Sunday=0, Monday=1, ..., Saturday=6
        // 設計書: 1=月曜, 2=火曜, ..., 7=日曜, 0=無効
        // 変換: DayOfWeek 0(日曜) -> 7, 1(月曜) -> 1, ...
        var deliveryDay = todayDayOfWeek == 0 ? 7 : todayDayOfWeek;

        // 今日が配信日の組織を取得（WeeklyReportDeliveryDay > 0 かつ今日の曜日と一致）
        var targetOrganizations = await _dbContext.OrganizationSettings
            .Where(os => os.WeeklyReportDeliveryDay == deliveryDay)
            .Include(os => os.Organization)
            .ToListAsync();

        _logger.LogInformation("WeeklyReport: Found {Count} organizations for delivery today (day={Day})",
            targetOrganizations.Count, deliveryDay);

        foreach (var org in targetOrganizations)
        {
            if (org.Organization?.IsDemo == true)
            {
                _logger.LogDebug("デモ組織のためメール送信をスキップしました。OrganizationId: {OrganizationId}", org.Organization.Id);
                continue;
            }

            //ジョブの中でジョブを追加する」パターン（ファンアウト/バッチ処理）
            // 組織ごとにレポート生成ジョブをキュー
            BackgroundJob.Enqueue<WeeklyReportTasks>(
                task => task.GenerateAndSendWeeklyReportAsync(org.Organization!));
        }
    }

    /// <summary>
    /// 組織単位: レポートを生成してメール送信
    /// </summary>
    public async Task GenerateAndSendWeeklyReportAsync(Organization organization)
    {
        _logger.LogInformation("WeeklyReport: Generating report for organization {OrgId} ({OrgName})",
            organization.Id, organization.Name);

        // フロントエンドURLを取得
        var dashboardBaseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();

        try
        {
            // 前週の日付範囲を取得
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var (weekStart, weekEnd) = WeeklyReportDataCollector.GetLastWeekDateRange(today);

            // 配信対象ユーザーを取得（Owner または Member、Viewer 除外）
            var targetUsers = await _dataCollector.GetDeliveryTargetUsersAsync(organization.Id);

            _logger.LogInformation("WeeklyReport: Found {Count} target users for organization {OrgId}",
                targetUsers.Count, organization.Id);

            var successCount = 0;
            var failCount = 0;

            foreach (var user in targetUsers)
            {
                try
                {
                    // ユーザーごとのレポートデータを収集
                    var reportData = await _dataCollector.CollectUserReportDataAsync(
                        organization.Id,
                        organization.Name,
                        user.UserId,
                        user.UserName,
                        user.Email,
                        user.IsOwner,
                        weekStart,
                        weekEnd);

                    // メールモデルを作成
                    var emailModel = new WeeklyReportEmailModel
                    {
                        UserName = reportData.UserName,
                        OrganizationName = reportData.OrganizationName,
                        WeekStartDate = reportData.WeekStartDate,
                        WeekEndDate = reportData.WeekEndDate,
                        PersonalSummary = reportData.PersonalSummary,
                        OwnerWorkspaces = reportData.OwnerWorkspaces,
                        DashboardUrl = dashboardBaseUrl
                    };

                    // メール送信
                    var subject = $"[Coati] 週間レポート: {organization.Name}（{weekStart:yyyy/MM/dd}週）";
                    await _emailService.SendTemplatedEmailAsync(user.Email, subject, emailModel);

                    successCount++;
                    _logger.LogDebug("WeeklyReport: Sent to user {UserId} ({Email})", user.UserId, user.Email);
                }
                catch (Exception ex)
                {
                    failCount++;
                    _logger.LogError(ex, "WeeklyReport: Failed to send to user {UserId} ({Email})", user.UserId, user.Email);
                }
            }

            _logger.LogInformation("WeeklyReport: Completed for organization {OrgId}. Success={Success}, Failed={Failed}",
                organization.Id, successCount, failCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WeeklyReport: Failed to generate report for organization {OrgId}", organization.Id);
            throw;
        }
    }
}