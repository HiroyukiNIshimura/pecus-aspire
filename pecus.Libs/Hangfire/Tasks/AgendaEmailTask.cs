using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Mail.Services;
using Pecus.Libs.Mail.Templates.Models;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// アジェンダ関連メール送信タスク
/// 未送信のAgendaNotificationに対してメールを送信する
/// </summary>
public class AgendaEmailTask
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;
    private readonly ILogger<AgendaEmailTask> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public AgendaEmailTask(
        ApplicationDbContext context,
        IEmailService emailService,
        IConfiguration config,
        ILogger<AgendaEmailTask> logger)
    {
        _context = context;
        _emailService = emailService;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// 未送信のアジェンダ通知メールを処理（5分ごとに実行される想定）
    /// </summary>
    public async Task ProcessPendingEmailsAsync()
    {
        var pendingNotifications = await _context.AgendaNotifications
            .Include(n => n.Agenda)
                .ThenInclude(a => a!.Organization)
            .Include(n => n.Agenda)
                .ThenInclude(a => a!.CreatedByUser)
            .Include(n => n.Agenda)
                .ThenInclude(a => a!.CancelledByUser)
            .Include(n => n.User)
            .Include(n => n.CreatedByUser)
            .Where(n => !n.IsEmailSent && n.Agenda != null)
            .OrderBy(n => n.CreatedAt)
            .Take(100) // バッチサイズ制限
            .ToListAsync();

        if (pendingNotifications.Count == 0)
        {
            _logger.LogDebug("未送信のアジェンダ通知メールはありません");
            return;
        }

        _logger.LogInformation(
            "未送信のアジェンダ通知メールが{Count}件見つかりました",
            pendingNotifications.Count);

        var successCount = 0;
        var failCount = 0;

        foreach (var notification in pendingNotifications)
        {
            try
            {
                await ProcessNotificationEmailAsync(notification);
                successCount++;
            }
            catch (Exception ex)
            {
                failCount++;
                _logger.LogError(
                    ex,
                    "アジェンダ通知メール送信に失敗: NotificationId={NotificationId}, Type={Type}",
                    notification.Id, notification.Type);
            }
        }

        _logger.LogInformation(
            "アジェンダ通知メール処理完了: 成功={Success}, 失敗={Failed}",
            successCount, failCount);
    }

    /// <summary>
    /// 個別通知のメール処理
    /// </summary>
    private async Task ProcessNotificationEmailAsync(AgendaNotification notification)
    {
        var agenda = notification.Agenda!;
        var user = notification.User!;
        var organization = agenda.Organization!;

        // デモ組織はスキップ
        if (organization.IsDemo)
        {
            _logger.LogDebug(
                "デモ組織のためメール送信をスキップ: NotificationId={NotificationId}",
                notification.Id);
            notification.IsEmailSent = true;
            await _context.SaveChangesAsync();
            return;
        }

        // ダミーアドレスはスキップ
        if (user.Email.EndsWith(".none"))
        {
            _logger.LogDebug(
                "ダミーアドレスのためメール送信をスキップ: NotificationId={NotificationId}",
                notification.Id);
            notification.IsEmailSent = true;
            await _context.SaveChangesAsync();
            return;
        }

        var baseUrl = _config["App:BaseUrl"] ?? "https://app.example.com";
        var agendaUrl = $"{baseUrl}/agendas/{agenda.Id}";

        switch (notification.Type)
        {
            case AgendaNotificationType.Invited:
                await SendInvitationEmailAsync(notification, agenda, user, organization, agendaUrl);
                break;

            case AgendaNotificationType.SeriesUpdated:
            case AgendaNotificationType.OccurrenceUpdated:
                await SendUpdatedEmailAsync(notification, agenda, user, organization, agendaUrl);
                break;

            case AgendaNotificationType.SeriesCancelled:
            case AgendaNotificationType.OccurrenceCancelled:
                await SendCancelledEmailAsync(notification, agenda, user, organization);
                break;

            case AgendaNotificationType.Reminder:
                // 予定開始N分前を切っている場合はリマインダー送信しても意味がないのでスキップ
                var cutoffMinutes = _config.GetValue("AgendaReminder:CutoffMinutes", 5);
                var reminderStartAt = notification.OccurrenceStartAt ?? agenda.StartAt;
                var reminderDeadline = reminderStartAt.AddMinutes(-cutoffMinutes);
                if (DateTime.UtcNow >= reminderDeadline)
                {
                    _logger.LogDebug(
                        "リマインダー送信期限を過ぎているためスキップ: NotificationId={NotificationId}, StartAt={StartAt}, Deadline={Deadline}",
                        notification.Id, reminderStartAt, reminderDeadline);
                    break;
                }
                await SendReminderEmailAsync(notification, agenda, user, organization, agendaUrl);
                break;

            case AgendaNotificationType.AddedToEvent:
                await SendInvitationEmailAsync(notification, agenda, user, organization, agendaUrl);
                break;

            case AgendaNotificationType.RemovedFromEvent:
                // 削除通知はメール不要
                break;

            case AgendaNotificationType.AttendanceDeclined:
                await SendAttendanceDeclinedEmailAsync(notification, agenda, user, organization, agendaUrl);
                break;

            default:
                _logger.LogWarning(
                    "未対応の通知タイプ: NotificationId={NotificationId}, Type={Type}",
                    notification.Id, notification.Type);
                break;
        }

        notification.IsEmailSent = true;
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// 招待メール送信
    /// </summary>
    private async Task SendInvitationEmailAsync(
        AgendaNotification notification,
        Agenda agenda,
        User user,
        Organization organization,
        string agendaUrl)
    {
        var invitedBy = notification.CreatedByUser ?? agenda.CreatedByUser;
        var recurrenceDesc = agenda.RecurrenceType != null && agenda.RecurrenceType != RecurrenceType.None
            ? RecurrenceHelper.GetRecurrenceDescription(agenda)
            : null;

        var model = new AgendaInvitationEmailModel
        {
            UserName = user.Username,
            AgendaTitle = agenda.Title,
            StartAt = notification.OccurrenceStartAt ?? agenda.StartAt,
            EndAt = notification.OccurrenceStartAt.HasValue
                ? notification.OccurrenceStartAt.Value + (agenda.EndAt - agenda.StartAt)
                : agenda.EndAt,
            IsAllDay = agenda.IsAllDay,
            Location = agenda.Location,
            Url = agenda.Url,
            RecurrenceDescription = recurrenceDesc,
            Description = agenda.Description,
            InvitedByName = invitedBy?.Username ?? "不明",
            OrganizationName = organization.Name,
            AgendaUrl = agendaUrl
        };

        var subject = $"【招待】{agenda.Title}";
        await _emailService.SendTemplatedEmailAsync(user.Email, subject, model);

        _logger.LogDebug(
            "招待メール送信完了: NotificationId={NotificationId}, To={To}",
            notification.Id, user.Email);
    }

    /// <summary>
    /// 変更通知メール送信
    /// </summary>
    private async Task SendUpdatedEmailAsync(
        AgendaNotification notification,
        Agenda agenda,
        User user,
        Organization organization,
        string agendaUrl)
    {
        var updatedBy = notification.CreatedByUser;

        var model = new AgendaUpdatedEmailModel
        {
            UserName = user.Username,
            AgendaTitle = agenda.Title,
            StartAt = notification.OccurrenceStartAt ?? agenda.StartAt,
            EndAt = notification.OccurrenceStartAt.HasValue
                ? notification.OccurrenceStartAt.Value + (agenda.EndAt - agenda.StartAt)
                : agenda.EndAt,
            IsAllDay = agenda.IsAllDay,
            Location = agenda.Location,
            Url = agenda.Url,
            ChangeDescription = notification.Message,
            UpdatedByName = updatedBy?.Username ?? "不明",
            OrganizationName = organization.Name,
            AgendaUrl = agendaUrl
        };

        var subject = $"【変更】{agenda.Title}";
        await _emailService.SendTemplatedEmailAsync(user.Email, subject, model);

        _logger.LogDebug(
            "変更通知メール送信完了: NotificationId={NotificationId}, To={To}",
            notification.Id, user.Email);
    }

    /// <summary>
    /// 中止通知メール送信
    /// </summary>
    private async Task SendCancelledEmailAsync(
        AgendaNotification notification,
        Agenda agenda,
        User user,
        Organization organization)
    {
        var cancelledBy = agenda.CancelledByUser ?? notification.CreatedByUser;

        var model = new AgendaCancelledEmailModel
        {
            UserName = user.Username,
            AgendaTitle = agenda.Title,
            OriginalStartAt = notification.OccurrenceStartAt ?? agenda.StartAt,
            OriginalEndAt = notification.OccurrenceStartAt.HasValue
                ? notification.OccurrenceStartAt.Value + (agenda.EndAt - agenda.StartAt)
                : agenda.EndAt,
            IsAllDay = agenda.IsAllDay,
            CancellationReason = agenda.CancellationReason ?? notification.Message,
            IsOccurrenceCancellation = notification.Type == AgendaNotificationType.OccurrenceCancelled,
            CancelledByName = cancelledBy?.Username ?? "不明",
            OrganizationName = organization.Name
        };

        var subject = notification.Type == AgendaNotificationType.OccurrenceCancelled
            ? $"【この回中止】{agenda.Title}"
            : $"【中止】{agenda.Title}";

        await _emailService.SendTemplatedEmailAsync(user.Email, subject, model);

        _logger.LogDebug(
            "中止通知メール送信完了: NotificationId={NotificationId}, To={To}",
            notification.Id, user.Email);
    }

    /// <summary>
    /// リマインダーメール送信
    /// </summary>
    private async Task SendReminderEmailAsync(
        AgendaNotification notification,
        Agenda agenda,
        User user,
        Organization organization,
        string agendaUrl)
    {
        var model = new AgendaReminderEmailModel
        {
            UserName = user.Username,
            AgendaTitle = agenda.Title,
            StartAt = notification.OccurrenceStartAt ?? agenda.StartAt,
            EndAt = notification.OccurrenceStartAt.HasValue
                ? notification.OccurrenceStartAt.Value + (agenda.EndAt - agenda.StartAt)
                : agenda.EndAt,
            IsAllDay = agenda.IsAllDay,
            Location = agenda.Location,
            Url = agenda.Url,
            ReminderMessage = notification.Message ?? "リマインダー",
            OrganizationName = organization.Name,
            AgendaUrl = agendaUrl
        };

        var subject = $"【リマインダー】{agenda.Title}";
        await _emailService.SendTemplatedEmailAsync(user.Email, subject, model);

        _logger.LogDebug(
            "リマインダーメール送信完了: NotificationId={NotificationId}, To={To}",
            notification.Id, user.Email);
    }

    /// <summary>
    /// 参加者不参加通知メール送信
    /// </summary>
    private async Task SendAttendanceDeclinedEmailAsync(
        AgendaNotification notification,
        Agenda agenda,
        User user,
        Organization organization,
        string agendaUrl)
    {
        var declinedBy = notification.CreatedByUser;
        var isOccurrence = notification.OccurrenceStartAt.HasValue
            && notification.OccurrenceStartAt.Value != agenda.StartAt;

        var model = new AgendaAttendanceDeclinedEmailModel
        {
            UserName = user.Username,
            AgendaTitle = agenda.Title,
            StartAt = notification.OccurrenceStartAt ?? agenda.StartAt,
            EndAt = notification.OccurrenceStartAt.HasValue
                ? notification.OccurrenceStartAt.Value + (agenda.EndAt - agenda.StartAt)
                : agenda.EndAt,
            IsAllDay = agenda.IsAllDay,
            DeclinedByName = declinedBy?.Username ?? "不明",
            IsOccurrenceDeclined = isOccurrence,
            OrganizationName = organization.Name,
            AgendaUrl = agendaUrl
        };

        var subject = $"【不参加】{declinedBy?.Username ?? "参加者"}さんが「{agenda.Title}」を不参加に変更しました";
        await _emailService.SendTemplatedEmailAsync(user.Email, subject, model);

        _logger.LogDebug(
            "不参加通知メール送信完了: NotificationId={NotificationId}, To={To}",
            notification.Id, user.Email);
    }
}
