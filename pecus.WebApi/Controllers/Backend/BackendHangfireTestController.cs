using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Models.Responses.Common;
using Pecus.Services;

namespace Pecus.Controllers.Backend;

/// <summary>
/// Hangfire動作確認用のテストコントローラー（バックエンド管理用）
/// </summary>
[Route("api/backend/hangfire-test")]
[Produces("application/json")]
public class BackendHangfireTestController : BaseBackendController
{
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly IRecurringJobManager _recurringJobManager;

    public BackendHangfireTestController(
        IBackgroundJobClient backgroundJobClient,
        IRecurringJobManager recurringJobManager,
        ILogger<BackendHangfireTestController> logger,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _backgroundJobClient = backgroundJobClient;
        _recurringJobManager = recurringJobManager;
    }

    /// <summary>
    /// Fire-and-forget ジョブのテスト
    /// </summary>
    /// <param name="message">ログに出力するメッセージ</param>
    /// <returns>ジョブID</returns>
    [HttpPost("fire-and-forget")]
    [ProducesResponseType(typeof(JobResponse), StatusCodes.Status200OK)]
    public Ok<JobResponse> FireAndForget([FromQuery] string message = "Hello from Hangfire!")
    {
        var jobId = _backgroundJobClient.Enqueue<HangfireTasks>(x => x.LogMessage(message));
        return TypedResults.Ok(new JobResponse
        {
            JobId = jobId,
            Message = "Fire-and-forget job enqueued"
        });
    }

    /// <summary>
    /// 遅延ジョブのテスト
    /// </summary>
    /// <param name="message">ログに出力するメッセージ</param>
    /// <param name="delaySeconds">遅延秒数（デフォルト: 10秒）</param>
    /// <returns>ジョブID</returns>
    [HttpPost("delayed")]
    [ProducesResponseType(typeof(JobResponse), StatusCodes.Status200OK)]
    public Ok<JobResponse> Delayed(
        [FromQuery] string message = "Delayed job executed!",
        [FromQuery] int delaySeconds = 10
    )
    {
        var jobId = _backgroundJobClient.Schedule<HangfireTasks>(
            x => x.LogMessage(message),
            TimeSpan.FromSeconds(delaySeconds)
        );
        return TypedResults.Ok(new JobResponse
        {
            JobId = jobId,
            Message = $"Delayed job scheduled for {delaySeconds} seconds"
        });
    }

    /// <summary>
    /// 継続ジョブのテスト
    /// </summary>
    /// <param name="parentMessage">親ジョブのメッセージ</param>
    /// <param name="childMessage">子ジョブのメッセージ</param>
    /// <returns>親ジョブIDと子ジョブID</returns>
    [HttpPost("continuation")]
    [ProducesResponseType(typeof(ContinuationResponse), StatusCodes.Status200OK)]
    public Ok<ContinuationResponse> Continuation(
        [FromQuery] string parentMessage = "Parent job",
        [FromQuery] string childMessage = "Child job"
    )
    {
        var parentJobId = _backgroundJobClient.Enqueue<HangfireTasks>(x =>
            x.LogMessage(parentMessage)
        );
        var childJobId = _backgroundJobClient.ContinueJobWith<HangfireTasks>(
            parentJobId,
            x => x.LogMessage(childMessage)
        );
        return TypedResults.Ok(new ContinuationResponse
        {
            ParentJobId = parentJobId,
            ChildJobId = childJobId,
            Message = "Continuation job created"
        });
    }

    /// <summary>
    /// 繰り返しジョブのテスト（Cron式）
    /// </summary>
    /// <param name="message">ログに出力するメッセージ</param>
    /// <param name="cronExpression">Cron式（デフォルト: 毎分実行）</param>
    /// <returns>繰り返しジョブID</returns>
    [HttpPost("recurring")]
    [ProducesResponseType(typeof(RecurringResponse), StatusCodes.Status200OK)]
    public Ok<RecurringResponse> Recurring(
        [FromQuery] string message = "Recurring job executed!",
        [FromQuery] string cronExpression = "* * * * *"
    )
    {
        var recurringJobId = $"test-recurring-{Guid.NewGuid():N}";
        _recurringJobManager.AddOrUpdate<HangfireTasks>(
            recurringJobId,
            x => x.LogMessage(message),
            cronExpression
        );
        return TypedResults.Ok(new RecurringResponse
        {
            RecurringJobId = recurringJobId,
            Message = "Recurring job created"
        });
    }

    /// <summary>
    /// 繰り返しジョブの削除
    /// </summary>
    /// <param name="recurringJobId">削除する繰り返しジョブID</param>
    [HttpDelete("recurring/{recurringJobId}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    public Ok<MessageResponse> DeleteRecurring(string recurringJobId)
    {
        _recurringJobManager.RemoveIfExists(recurringJobId);
        return TypedResults.Ok(new MessageResponse { Message = $"Recurring job '{recurringJobId}' removed" });
    }

    /// <summary>
    /// 失敗したジョブを削除
    /// </summary>
    /// <param name="jobId">削除するジョブID</param>
    [HttpDelete("failed/{jobId}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status404NotFound)]
    public Results<Ok<MessageResponse>, NotFound<MessageResponse>> DeleteFailedJob(string jobId)
    {
        var deleted = _backgroundJobClient.Delete(jobId);
        if (deleted)
        {
            return TypedResults.Ok(new MessageResponse { Message = $"Failed job '{jobId}' deleted successfully" });
        }
        return TypedResults.NotFound(new MessageResponse { Message = $"Job '{jobId}' not found or could not be deleted" });
    }

    /// <summary>
    /// 長時間実行ジョブのテスト
    /// </summary>
    /// <param name="durationSeconds">実行時間（秒）</param>
    /// <returns>ジョブID</returns>
    [HttpPost("long-running")]
    [ProducesResponseType(typeof(JobResponse), StatusCodes.Status200OK)]
    public Ok<JobResponse> LongRunning([FromQuery] int durationSeconds = 30)
    {
        var jobId = _backgroundJobClient.Enqueue<HangfireTasks>(x =>
            x.LongRunningTask(durationSeconds)
        );
        return TypedResults.Ok(new JobResponse
        {
            JobId = jobId,
            Message = $"Long-running job enqueued (duration: {durationSeconds}s)"
        });
    }

    /// <summary>
    /// エラーを発生させるジョブのテスト
    /// </summary>
    /// <param name="errorMessage">エラーメッセージ</param>
    /// <returns>ジョブID</returns>
    [HttpPost("error")]
    [ProducesResponseType(typeof(JobResponse), StatusCodes.Status200OK)]
    public Ok<JobResponse> Error([FromQuery] string errorMessage = "Test error")
    {
        var jobId = _backgroundJobClient.Enqueue<HangfireTasks>(x => x.ThrowError(errorMessage));
        return TypedResults.Ok(new JobResponse
        {
            JobId = jobId,
            Message = "Error job enqueued"
        });
    }

    /// <summary>
    /// バッチジョブのテスト
    /// </summary>
    /// <param name="count">ジョブ数</param>
    /// <returns>ジョブIDのリスト</returns>
    [HttpPost("batch")]
    [ProducesResponseType(typeof(BatchResponse), StatusCodes.Status200OK)]
    public Ok<BatchResponse> Batch([FromQuery] int count = 5)
    {
        var jobIds = new List<string>();
        for (int i = 0; i < count; i++)
        {
            var index = i; // ローカル変数にコピー
            var jobId = _backgroundJobClient.Enqueue<HangfireTasks>(x =>
                x.LogMessage($"Batch job {index + 1}/{count}")
            );
            jobIds.Add(jobId);
        }
        return TypedResults.Ok(new BatchResponse
        {
            JobIds = jobIds,
            Message = $"{count} batch jobs enqueued"
        });
    }
}
