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
        var summary = await _dashboardService.GetOrganizationSummaryAsync(CurrentOrganizationId!.Value);
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
        var response = await _dashboardService.GetOrganizationTasksByPriorityAsync(CurrentOrganizationId!.Value);
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
        var summary = await _dashboardService.GetPersonalSummaryAsync(CurrentUserId, CurrentOrganizationId!.Value);
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
        var response = await _dashboardService.GetWorkspaceBreakdownAsync(CurrentOrganizationId!.Value);
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
        var response = await _dashboardService.GetTaskTrendAsync(CurrentOrganizationId!.Value, weeks);
        return TypedResults.Ok(response);
    }
}
