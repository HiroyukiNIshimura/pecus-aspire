using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Models.Responses.Dashboard;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// ダッシュボード統計コントローラー
/// 組織・個人レベルの統計情報を提供
/// </summary>
[Route("api/dashboard")]
[Produces("application/json")]
[Tags("Dashboard")]
public class DashboardStatisticsController : BaseSecureController
{
    private readonly DashboardStatisticsService _dashboardService;
    private readonly ILogger<DashboardStatisticsController> _logger;

    public DashboardStatisticsController(
        DashboardStatisticsService dashboardService,
        ProfileService profileService,
        ILogger<DashboardStatisticsController> logger
    ) : base(profileService, logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// 組織のダッシュボードサマリを取得
    /// タスクとアイテムの現在状態を集計したサマリ情報
    /// </summary>
    /// <returns>ダッシュボードサマリ</returns>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<DashboardSummaryResponse>> GetOrganizationSummary()
    {
        var summary = await _dashboardService.GetOrganizationSummaryAsync(CurrentOrganizationId);
        return TypedResults.Ok(summary);
    }

    /// <summary>
    /// 組織の優先度別タスク数を取得
    /// 進行中タスクの優先度別内訳
    /// </summary>
    /// <returns>優先度別タスク数</returns>
    [HttpGet("tasks/by-priority")]
    [ProducesResponseType(typeof(DashboardTasksByPriorityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<DashboardTasksByPriorityResponse>> GetTasksByPriority()
    {
        var response = await _dashboardService.GetOrganizationTasksByPriorityAsync(CurrentOrganizationId);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 個人のダッシュボードサマリを取得
    /// ログインユーザー自身のタスク状況
    /// </summary>
    /// <returns>個人サマリ</returns>
    [HttpGet("personal/summary")]
    [ProducesResponseType(typeof(DashboardPersonalSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<DashboardPersonalSummaryResponse>> GetPersonalSummary()
    {
        var summary = await _dashboardService.GetPersonalSummaryAsync(CurrentUserId, CurrentOrganizationId);
        return TypedResults.Ok(summary);
    }

    /// <summary>
    /// ワークスペース別統計を取得
    /// 組織内の各ワークスペースのタスク・アイテム状況
    /// </summary>
    /// <returns>ワークスペース別統計</returns>
    [HttpGet("workspaces")]
    [ProducesResponseType(typeof(DashboardWorkspaceBreakdownResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<DashboardWorkspaceBreakdownResponse>> GetWorkspaceBreakdown()
    {
        var response = await _dashboardService.GetWorkspaceBreakdownAsync(CurrentOrganizationId);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 週次タスクトレンドを取得
    /// タスクの作成数/完了数の週次推移
    /// </summary>
    /// <param name="weeks">取得する週数（1-12、デフォルト8）</param>
    /// <returns>週次タスクトレンド</returns>
    [HttpGet("tasks/trend")]
    [ProducesResponseType(typeof(DashboardTaskTrendResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<DashboardTaskTrendResponse>> GetTaskTrend([FromQuery] int weeks = 8)
    {
        // 週数を1-12の範囲に制限
        weeks = Math.Clamp(weeks, 1, 12);
        var response = await _dashboardService.GetTaskTrendAsync(CurrentOrganizationId, weeks);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ホットアイテムを取得
    /// 直近でアクティビティが多いアイテムのランキング
    /// </summary>
    /// <param name="period">集計期間（"24h" または "1week"、デフォルト "24h"）</param>
    /// <param name="limit">取得件数（1-20、デフォルト10）</param>
    /// <returns>ホットアイテムランキング</returns>
    [HttpGet("hot-items")]
    [ProducesResponseType(typeof(DashboardHotItemsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<DashboardHotItemsResponse>> GetHotItems(
        [FromQuery] string period = "24h",
        [FromQuery] int limit = 10)
    {
        var hotPeriod = period.ToLowerInvariant() switch
        {
            "1week" or "week" or "7d" => HotPeriod.Last1Week,
            _ => HotPeriod.Last24Hours,
        };
        limit = Math.Clamp(limit, 1, 20);

        var response = await _dashboardService.GetHotItemsAsync(CurrentOrganizationId, CurrentUserId, hotPeriod, limit);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ホットワークスペースを取得
    /// タスク関連アクティビティが活発なワークスペースのランキング
    /// </summary>
    /// <param name="period">集計期間（"24h" または "1week"、デフォルト "24h"）</param>
    /// <param name="limit">取得件数（1-20、デフォルト10）</param>
    /// <returns>ホットワークスペースランキング</returns>
    [HttpGet("hot-workspaces")]
    [ProducesResponseType(typeof(DashboardHotWorkspacesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<DashboardHotWorkspacesResponse>> GetHotWorkspaces(
        [FromQuery] string period = "24h",
        [FromQuery] int limit = 10)
    {
        var hotPeriod = period.ToLowerInvariant() switch
        {
            "1week" or "week" or "7d" => HotPeriod.Last1Week,
            _ => HotPeriod.Last24Hours,
        };
        limit = Math.Clamp(limit, 1, 20);

        var response = await _dashboardService.GetHotWorkspacesAsync(CurrentOrganizationId, hotPeriod, limit);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ヘルプコメント一覧を取得
    /// HelpWanted タイプのコメントで、未完了・未破棄のタスクに紐づくもの
    /// </summary>
    /// <returns>ヘルプコメント一覧</returns>
    [HttpGet("help-comments")]
    [ProducesResponseType(typeof(DashboardHelpCommentsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<DashboardHelpCommentsResponse>> GetHelpComments()
    {
        var response = await _dashboardService.GetHelpCommentsAsync(CurrentOrganizationId);
        return TypedResults.Ok(response);
    }
}