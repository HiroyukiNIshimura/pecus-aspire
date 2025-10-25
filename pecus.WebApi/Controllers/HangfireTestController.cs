using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.Hangfire.Tasks;

namespace Pecus.Controllers;

/// <summary>
/// Hangfire動作確認用のテストコントローラー
/// </summary>
[ApiController]
[Route("api/hangfire-test")]
[Produces("application/json")]
[AllowAnonymous]
public class HangfireTestController : ControllerBase
{
    private readonly ILogger<HangfireTestController> _logger;

    public HangfireTestController(ILogger<HangfireTestController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Fire-and-forget ジョブのテスト
    /// </summary>
    /// <param name="message">ログに出力するメッセージ</param>
    /// <returns>ジョブID</returns>
    [HttpPost("fire-and-forget")]
    public IActionResult FireAndForget([FromQuery] string message = "Hello from Hangfire!")
    {
        var jobId = BackgroundJob.Enqueue<HangfireTasks>(x => x.LogMessage(message));
        return Ok(
            new
            {
                JobId = jobId,
                Message = "Fire-and-forget job enqueued",
                Input = message,
            }
        );
    }

    /// <summary>
    /// 遅延ジョブのテスト
    /// </summary>
    /// <param name="message">ログに出力するメッセージ</param>
    /// <param name="delaySeconds">遅延秒数（デフォルト: 10秒）</param>
    /// <returns>ジョブID</returns>
    [HttpPost("delayed")]
    public IActionResult Delayed(
        [FromQuery] string message = "Delayed job executed!",
        [FromQuery] int delaySeconds = 10
    )
    {
        var jobId = BackgroundJob.Schedule<HangfireTasks>(
            x => x.LogMessage(message),
            TimeSpan.FromSeconds(delaySeconds)
        );
        return Ok(
            new
            {
                JobId = jobId,
                Message = $"Delayed job scheduled for {delaySeconds} seconds",
                Input = message,
            }
        );
    }

    /// <summary>
    /// 継続ジョブのテスト
    /// </summary>
    /// <param name="parentMessage">親ジョブのメッセージ</param>
    /// <param name="childMessage">子ジョブのメッセージ</param>
    /// <returns>親ジョブIDと子ジョブID</returns>
    [HttpPost("continuation")]
    public IActionResult Continuation(
        [FromQuery] string parentMessage = "Parent job",
        [FromQuery] string childMessage = "Child job"
    )
    {
        var parentJobId = BackgroundJob.Enqueue<HangfireTasks>(x => x.LogMessage(parentMessage));
        var childJobId = BackgroundJob.ContinueJobWith<HangfireTasks>(
            parentJobId,
            x => x.LogMessage(childMessage)
        );
        return Ok(
            new
            {
                ParentJobId = parentJobId,
                ChildJobId = childJobId,
                Message = "Continuation job created",
            }
        );
    }

    /// <summary>
    /// 繰り返しジョブのテスト（Cron式）
    /// </summary>
    /// <param name="message">ログに出力するメッセージ</param>
    /// <param name="cronExpression">Cron式（デフォルト: 毎分実行）</param>
    /// <returns>繰り返しジョブID</returns>
    [HttpPost("recurring")]
    public IActionResult Recurring(
        [FromQuery] string message = "Recurring job executed!",
        [FromQuery] string cronExpression = "* * * * *"
    )
    {
        var recurringJobId = $"test-recurring-{Guid.NewGuid():N}";
        RecurringJob.AddOrUpdate<HangfireTasks>(
            recurringJobId,
            x => x.LogMessage(message),
            cronExpression
        );
        return Ok(
            new
            {
                RecurringJobId = recurringJobId,
                Message = "Recurring job created",
                CronExpression = cronExpression,
            }
        );
    }

    /// <summary>
    /// 繰り返しジョブの削除
    /// </summary>
    /// <param name="recurringJobId">削除する繰り返しジョブID</param>
    [HttpDelete("recurring/{recurringJobId}")]
    public IActionResult DeleteRecurring(string recurringJobId)
    {
        RecurringJob.RemoveIfExists(recurringJobId);
        return Ok(new { Message = $"Recurring job '{recurringJobId}' removed" });
    }

    /// <summary>
    /// 長時間実行ジョブのテスト
    /// </summary>
    /// <param name="durationSeconds">実行時間（秒）</param>
    /// <returns>ジョブID</returns>
    [HttpPost("long-running")]
    public IActionResult LongRunning([FromQuery] int durationSeconds = 30)
    {
        var jobId = BackgroundJob.Enqueue<HangfireTasks>(x => x.LongRunningTask(durationSeconds));
        return Ok(
            new
            {
                JobId = jobId,
                Message = $"Long-running job enqueued (duration: {durationSeconds}s)",
            }
        );
    }

    /// <summary>
    /// エラーを発生させるジョブのテスト
    /// </summary>
    /// <param name="errorMessage">エラーメッセージ</param>
    /// <returns>ジョブID</returns>
    [HttpPost("error")]
    public IActionResult Error([FromQuery] string errorMessage = "Test error")
    {
        var jobId = BackgroundJob.Enqueue<HangfireTasks>(x => x.ThrowError(errorMessage));
        return Ok(new { JobId = jobId, Message = "Error job enqueued" });
    }

    /// <summary>
    /// バッチジョブのテスト
    /// </summary>
    /// <param name="count">ジョブ数</param>
    /// <returns>ジョブIDのリスト</returns>
    [HttpPost("batch")]
    public IActionResult Batch([FromQuery] int count = 5)
    {
        var jobIds = new List<string>();
        for (int i = 0; i < count; i++)
        {
            var index = i; // ローカル変数にコピー
            var jobId = BackgroundJob.Enqueue<HangfireTasks>(x =>
                x.LogMessage($"Batch job {index + 1}/{count}")
            );
            jobIds.Add(jobId);
        }
        return Ok(new { JobIds = jobIds, Message = $"{count} batch jobs enqueued" });
    }
}
