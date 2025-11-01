using Microsoft.Extensions.Logging;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// Hangfireで実行されるタスクを定義するクラス
/// </summary>
public class HangfireTasks
{
    private readonly ILogger<HangfireTasks> _logger;

    /// <summary>
    /// HangfireTasks のコンストラクタ
    /// </summary>
    /// <param name="logger">ロガー</param>
    public HangfireTasks(ILogger<HangfireTasks> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// メッセージをログに出力するタスク
    /// </summary>
    /// <param name="message">ログに出力するメッセージ</param>
    public void LogMessage(string message)
    {
        _logger.LogInformation("Hangfire Job executed: {Message}", message);
        Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] Hangfire Job: {message}");
    }

    /// <summary>
    /// 長時間実行タスク
    /// </summary>
    /// <param name="durationSeconds">実行時間（秒）</param>
    public void LongRunningTask(int durationSeconds)
    {
        _logger.LogInformation(
            "Long-running task started (duration: {Duration}s)",
            durationSeconds
        );

        for (int i = 0; i < durationSeconds; i++)
        {
            Thread.Sleep(1000);
            if (i % 5 == 0)
            {
                _logger.LogInformation(
                    "Long-running task progress: {Progress}s/{Total}s",
                    i,
                    durationSeconds
                );
            }
        }

        _logger.LogInformation("Long-running task completed");
    }

    /// <summary>
    /// エラーをスローするタスク
    /// </summary>
    /// <param name="errorMessage">エラーメッセージ</param>
    public void ThrowError(string errorMessage)
    {
        _logger.LogWarning("About to throw error: {ErrorMessage}", errorMessage);
        throw new InvalidOperationException(errorMessage);
    }

    /// <summary>
    /// データ処理タスク（例：バッチ処理）
    /// </summary>
    /// <param name="batchId">バッチID</param>
    /// <param name="itemCount">処理するアイテム数</param>
    public void ProcessBatch(string batchId, int itemCount)
    {
        _logger.LogInformation(
            "Batch processing started: BatchId={BatchId}, ItemCount={ItemCount}",
            batchId,
            itemCount
        );

        for (int i = 0; i < itemCount; i++)
        {
            // 実際の処理をシミュレート
            Thread.Sleep(100);
            _logger.LogDebug(
                "Processed item {Current}/{Total} in batch {BatchId}",
                i + 1,
                itemCount,
                batchId
            );
        }

        _logger.LogInformation("Batch processing completed: BatchId={BatchId}", batchId);
    }

    /// <summary>
    /// メール送信タスク（シミュレーション）
    /// </summary>
    /// <param name="to">送信先メールアドレス</param>
    /// <param name="subject">件名</param>
    /// <param name="body">本文</param>
    public void SendEmail(string to, string subject, string body)
    {
        _logger.LogInformation("Sending email: To={To}, Subject={Subject}", to, subject);

        // メール送信のシミュレーション
        Thread.Sleep(500);

        _logger.LogInformation("Email sent successfully to {To}", to);
    }

    /// <summary>
    /// レポート生成タスク（シミュレーション）
    /// </summary>
    /// <param name="reportType">レポートタイプ</param>
    /// <param name="startDate">開始日</param>
    /// <param name="endDate">終了日</param>
    public void GenerateReport(string reportType, DateTime startDate, DateTime endDate)
    {
        _logger.LogInformation(
            "Generating report: Type={ReportType}, Period={StartDate} to {EndDate}",
            reportType,
            startDate,
            endDate
        );

        // レポート生成のシミュレーション
        Thread.Sleep(2000);

        _logger.LogInformation("Report generated successfully: Type={ReportType}", reportType);
    }

    /// <summary>
    /// データクリーンアップタスク
    /// </summary>
    /// <param name="olderThanDays">指定日数より古いデータを削除</param>
    public void CleanupOldData(int olderThanDays)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-olderThanDays);
        _logger.LogInformation(
            "Cleaning up data older than {CutoffDate} ({Days} days)",
            cutoffDate,
            olderThanDays
        );

        // クリーンアップ処理のシミュレーション
        Thread.Sleep(1000);
        var deletedCount = Random.Shared.Next(10, 100);

        _logger.LogInformation("Cleanup completed: {Count} records deleted", deletedCount);
    }

    /// <summary>
    /// 定期ヘルスチェックタスク
    /// </summary>
    public void HealthCheck()
    {
        _logger.LogInformation("Running health check...");

        // 各種チェックのシミュレーション
        var checks = new Dictionary<string, bool>
        {
            { "Database", true },
            { "Redis", true },
            { "ExternalAPI", Random.Shared.Next(0, 10) > 1 }, // 10%の確率で失敗
        };

        foreach (var check in checks)
        {
            if (check.Value)
            {
                _logger.LogInformation("Health check passed: {Service}", check.Key);
            }
            else
            {
                _logger.LogWarning("Health check failed: {Service}", check.Key);
            }
        }

        _logger.LogInformation("Health check completed");
    }
}
