using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;
using System.Text.Json.Serialization;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// AIが解析した日付情報を表すレスポンスモデル
/// </summary>
public class ReminderDateResponse
{
    /// <summary>
    /// 年（省略可能、nullの場合は未来として成り立つ年を推定）
    /// </summary>
    [JsonPropertyName("year")]
    public int? Year { get; set; }

    /// <summary>
    /// 月（1-12）
    /// </summary>
    [JsonPropertyName("month")]
    public int? Month { get; set; }

    /// <summary>
    /// 日（1-31）
    /// </summary>
    [JsonPropertyName("day")]
    public int? Day { get; set; }
}

/// <summary>
/// タスクコメントで Reminder（催促）が投稿された際にAIで日付を解析し、リマインダーをスケジュールする Hangfire タスク
/// </summary>
public class TaskCommentReminderTask
{
    private const string DateExtractionPrompt = """
        あなたはテキストから日付情報を抽出するアシスタントです。
        ユーザーが入力したテキストから、リマインダーとして設定したい日付を抽出してください。

        ルール:
        - 日付情報が見つかった場合は、year, month, day をJSON形式で返してください
        - 年が明示されていない場合は year を null にしてください
        - 日付情報が見つからない場合や、日付として解釈できない場合は、month と day を null にしてください
        - 「明日」「来週」などの相対的な表現は、具体的な日付に変換しないでください（null を返す）
        - 必ず指定されたJSON形式で返してください
        """;

    private static readonly TimeZoneInfo JstTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Tokyo Standard Time");

    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<TaskCommentReminderTask> _logger;

    /// <summary>
    /// TaskCommentReminderTask のコンストラクタ
    /// </summary>
    public TaskCommentReminderTask(
        ApplicationDbContext context,
        IAiClientFactory aiClientFactory,
        IBackgroundJobClient backgroundJobClient,
        ILogger<TaskCommentReminderTask> logger)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
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

            var dateResponse = await ExtractDateFromCommentAsync(aiClient, comment.Content);

            if (dateResponse == null || !dateResponse.Month.HasValue || !dateResponse.Day.HasValue)
            {
                _logger.LogDebug(
                    "No valid date found in comment: CommentId={CommentId}",
                    commentId);
                return;
            }

            var reminderDate = ResolveReminderDate(dateResponse);
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

            _backgroundJobClient.Schedule<TaskCommentReminderFireTask>(
                x => x.SendReminderFireNotificationAsync(commentId, reminderDate.Value.Month, reminderDate.Value.Day),
                scheduleTime);

            _logger.LogInformation(
                "Reminder scheduled: CommentId={CommentId}, ReminderDate={ReminderDate}, ScheduleTime={ScheduleTime}",
                commentId,
                reminderDate.Value.ToString("yyyy-MM-dd"),
                scheduleTime);
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
    /// AIを使用してコメントから日付情報を抽出する
    /// </summary>
    private async Task<ReminderDateResponse?> ExtractDateFromCommentAsync(IAiClient aiClient, string commentContent)
    {
        try
        {
            var response = await aiClient.GenerateJsonAsync<ReminderDateResponse>(
                DateExtractionPrompt,
                commentContent);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to extract date from comment using AI");
            return null;
        }
    }

    /// <summary>
    /// 日付レスポンスから有効な未来の日付を解決する
    /// </summary>
    private static DateOnly? ResolveReminderDate(ReminderDateResponse dateResponse)
    {
        if (!dateResponse.Month.HasValue || !dateResponse.Day.HasValue)
        {
            return null;
        }

        var month = dateResponse.Month.Value;
        var day = dateResponse.Day.Value;

        if (month < 1 || month > 12 || day < 1 || day > 31)
        {
            return null;
        }

        var nowJst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, JstTimeZone);
        var todayJst = DateOnly.FromDateTime(nowJst);

        int year;
        if (dateResponse.Year.HasValue)
        {
            year = dateResponse.Year.Value;
        }
        else
        {
            year = todayJst.Year;
            var candidateDate = CreateValidDate(year, month, day);
            if (candidateDate == null || candidateDate.Value <= todayJst)
            {
                year = todayJst.Year + 1;
            }
        }

        var reminderDate = CreateValidDate(year, month, day);
        if (reminderDate == null)
        {
            return null;
        }

        if (reminderDate.Value <= todayJst)
        {
            return null;
        }

        return reminderDate;
    }

    /// <summary>
    /// 有効な日付を作成する（無効な日付の場合はnull）
    /// </summary>
    private static DateOnly? CreateValidDate(int year, int month, int day)
    {
        try
        {
            var daysInMonth = DateTime.DaysInMonth(year, month);
            if (day > daysInMonth)
            {
                return null;
            }
            return new DateOnly(year, month, day);
        }
        catch
        {
            return null;
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
