using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Services;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// タスクコメントで リマインダーが投稿された際にAIで日付を解析し、リマインダーをスケジュールする Hangfire タスク
/// </summary>
public class TaskCommentReminderTask
{
    private static readonly TimeZoneInfo JstTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Tokyo Standard Time");

    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly IDateExtractor _dateExtractor;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<TaskCommentReminderTask> _logger;

    /// <summary>
    /// TaskCommentReminderTask のコンストラクタ
    /// </summary>
    public TaskCommentReminderTask(
        ApplicationDbContext context,
        IAiClientFactory aiClientFactory,
        IDateExtractor dateExtractor,
        IBackgroundJobClient backgroundJobClient,
        ILogger<TaskCommentReminderTask> logger)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
        _dateExtractor = dateExtractor;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
    }

    /// <summary>
    /// Reminder コメントを解析してリマインダーをスケジュールする
    /// </summary>
    /// <param name="commentId">タスクコメントID</param>
    public async Task ScheduleReminderAsync(int commentId)
    {
        try
        {
            var comment = await _context.TaskComments
                .Include(c => c.User)
                .Include(c => c.WorkspaceTask)
                    .ThenInclude(t => t.WorkspaceItem)
                        .ThenInclude(i => i!.Workspace)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null)
            {
                _logger.LogWarning(
                    "TaskComment not found: CommentId={CommentId}",
                    commentId);
                return;
            }

            if (comment.CommentType != TaskCommentType.Reminder)
            {
                _logger.LogDebug(
                    "TaskComment is not Reminder type, skipping: CommentId={CommentId}, Type={Type}",
                    commentId,
                    comment.CommentType);
                return;
            }

            var task = comment.WorkspaceTask;
            var item = task?.WorkspaceItem;
            var workspace = item?.Workspace;

            if (workspace == null || task == null || item == null)
            {
                _logger.LogWarning(
                    "Workspace, Task, or Item not found for comment: CommentId={CommentId}",
                    commentId);
                return;
            }

            var organizationId = workspace.OrganizationId;

            var setting = await _context.OrganizationSettings
                .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

            if (setting == null ||
                setting.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting.GenerativeApiModel))
            {
                _logger.LogDebug(
                    "AI settings not configured for organization, skipping reminder: OrganizationId={OrganizationId}",
                    organizationId);
                return;
            }

            var aiClient = _aiClientFactory.CreateClient(
                setting.GenerativeApiVendor,
                setting.GenerativeApiKey,
                setting.GenerativeApiModel);

            if (aiClient == null)
            {
                _logger.LogWarning(
                    "Failed to create AI client: OrganizationId={OrganizationId}",
                    organizationId);
                return;
            }

            var dateResponse = await _dateExtractor.ExtractDateAsync(aiClient, comment.Content);

            if (dateResponse == null || !dateResponse.Month.HasValue || !dateResponse.Day.HasValue)
            {
                _logger.LogDebug(
                    "No valid date found in comment: CommentId={CommentId}",
                    commentId);
                return;
            }

            var reminderDate = _dateExtractor.ResolveFutureDate(dateResponse, JstTimeZone);
            if (reminderDate == null)
            {
                _logger.LogDebug(
                    "Could not resolve valid future date from comment: CommentId={CommentId}, Month={Month}, Day={Day}",
                    commentId,
                    dateResponse.Month,
                    dateResponse.Day);
                return;
            }

            var scheduleTime = CalculateScheduleTime(reminderDate.Value);

            var jobId = _backgroundJobClient.Schedule<TaskCommentReminderFireTask>(
                x => x.SendReminderFireNotificationAsync(commentId, reminderDate.Value.Month, reminderDate.Value.Day),
                scheduleTime);

            // ジョブIDをコメントに保存（削除・更新時にキャンセルするため）
            comment.ReminderJobId = jobId;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Reminder scheduled: CommentId={CommentId}, ReminderDate={ReminderDate}, ScheduleTime={ScheduleTime}, JobId={JobId}",
                commentId,
                reminderDate.Value.ToString("yyyy-MM-dd"),
                scheduleTime,
                jobId);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "TaskCommentReminderTask failed: CommentId={CommentId}",
                commentId);

            throw;
        }
    }

    /// <summary>
    /// リマインダー日の8:00 JSTをUTCに変換してスケジュール時刻を計算する
    /// </summary>
    private static DateTimeOffset CalculateScheduleTime(DateOnly reminderDate)
    {
        var reminderDateTime = new DateTime(
            reminderDate.Year,
            reminderDate.Month,
            reminderDate.Day,
            8, 0, 0,
            DateTimeKind.Unspecified);

        var jstOffset = JstTimeZone.GetUtcOffset(reminderDateTime);
        var reminderDateTimeOffset = new DateTimeOffset(reminderDateTime, jstOffset);

        return reminderDateTimeOffset.ToUniversalTime();
    }
}