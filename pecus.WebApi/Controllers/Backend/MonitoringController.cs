using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using pecus.WebApi.Models.Responses;
using Pecus.Services;

namespace Pecus.Controllers.Backend;

/// <summary>
///     バックオフィス向けモニタリングコントローラー
/// </summary>
[Route("api/backend/monitoring")]
public class MonitoringController : BaseBackendController
{
    private readonly ILogger<MonitoringController> _logger;

    public MonitoringController(
        ILogger<MonitoringController> logger,
        ILogger<BaseBackendController> baseLogger,
        ProfileService profileService)
        : base(profileService, baseLogger)
    {
        _logger = logger;
    }

    /// <summary>
    ///     Hangfireのジョブ統計を取得します
    /// </summary>
    /// <returns>統計情報</returns>
    [HttpGet("hangfire-stats")]
    [ProducesResponseType(typeof(HangfireStatsResponse), StatusCodes.Status200OK)]
    public IActionResult GetHangfireStats()
    {
        try
        {
            var monitoringApi = JobStorage.Current.GetMonitoringApi();
            var stats = monitoringApi.GetStatistics();
            var servers = monitoringApi.Servers();

            var response = new HangfireStatsResponse
            {
                Enqueued = stats.Enqueued,
                Failed = stats.Failed,
                Processing = stats.Processing,
                Scheduled = stats.Scheduled,
                Succeeded = stats.Succeeded,
                Deleted = stats.Deleted,
                Recurring = stats.Recurring,
                ServerCount = servers.Count,
                WorkerCount = servers.Sum(s => s.WorkersCount)
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Hangfire統計の取得に失敗しました");
            // Hangfireが利用できない場合でも500エラーにせず、ゼロ値を返すなどのハンドリングも検討可能だが、
            // サーバーエラーとして返すのが正しい動作。
            throw;
        }
    }
}
