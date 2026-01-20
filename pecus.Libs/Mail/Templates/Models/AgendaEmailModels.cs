namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// アジェンダ招待メールテンプレート用モデル
/// </summary>
public class AgendaInvitationEmailModel : EmailTemplateModelBase, IEmailTemplateModel<AgendaInvitationEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "agenda-invitation";

    /// <summary>宛先ユーザー名</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>アジェンダタイトル</summary>
    public string AgendaTitle { get; set; } = string.Empty;

    /// <summary>開始日時</summary>
    public DateTimeOffset StartAt { get; set; }

    /// <summary>終了日時</summary>
    public DateTimeOffset EndAt { get; set; }

    /// <summary>終日フラグ</summary>
    public bool IsAllDay { get; set; }

    /// <summary>場所（任意）</summary>
    public string? Location { get; set; }

    /// <summary>URL（任意）</summary>
    public string? Url { get; set; }

    /// <summary>繰り返し説明（例: 毎週月曜日）</summary>
    public string? RecurrenceDescription { get; set; }

    /// <summary>詳細（任意）</summary>
    public string? Description { get; set; }

    /// <summary>招待者名</summary>
    public string InvitedByName { get; set; } = string.Empty;

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>アジェンダ詳細ページ URL</summary>
    public string AgendaUrl { get; set; } = string.Empty;
}

/// <summary>
/// アジェンダ変更通知メールテンプレート用モデル
/// </summary>
public class AgendaUpdatedEmailModel : EmailTemplateModelBase, IEmailTemplateModel<AgendaUpdatedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "agenda-updated";

    /// <summary>宛先ユーザー名</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>アジェンダタイトル</summary>
    public string AgendaTitle { get; set; } = string.Empty;

    /// <summary>開始日時</summary>
    public DateTimeOffset StartAt { get; set; }

    /// <summary>終了日時</summary>
    public DateTimeOffset EndAt { get; set; }

    /// <summary>終日フラグ</summary>
    public bool IsAllDay { get; set; }

    /// <summary>場所（任意）</summary>
    public string? Location { get; set; }

    /// <summary>URL（任意）</summary>
    public string? Url { get; set; }

    /// <summary>変更内容の説明（任意）</summary>
    public string? ChangeDescription { get; set; }

    /// <summary>変更者名</summary>
    public string UpdatedByName { get; set; } = string.Empty;

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>アジェンダ詳細ページ URL</summary>
    public string AgendaUrl { get; set; } = string.Empty;
}

/// <summary>
/// アジェンダ中止通知メールテンプレート用モデル
/// </summary>
public class AgendaCancelledEmailModel : EmailTemplateModelBase, IEmailTemplateModel<AgendaCancelledEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "agenda-cancelled";

    /// <summary>宛先ユーザー名</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>アジェンダタイトル</summary>
    public string AgendaTitle { get; set; } = string.Empty;

    /// <summary>元の開始日時</summary>
    public DateTimeOffset OriginalStartAt { get; set; }

    /// <summary>元の終了日時</summary>
    public DateTimeOffset OriginalEndAt { get; set; }

    /// <summary>終日フラグ</summary>
    public bool IsAllDay { get; set; }

    /// <summary>中止理由（任意）</summary>
    public string? CancellationReason { get; set; }

    /// <summary>特定回の中止か（true: この回のみ、false: シリーズ全体）</summary>
    public bool IsOccurrenceCancellation { get; set; }

    /// <summary>中止者名</summary>
    public string CancelledByName { get; set; } = string.Empty;

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;
}

/// <summary>
/// アジェンダリマインダーメールテンプレート用モデル
/// </summary>
public class AgendaReminderEmailModel : EmailTemplateModelBase, IEmailTemplateModel<AgendaReminderEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "agenda-reminder";

    /// <summary>宛先ユーザー名</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>アジェンダタイトル</summary>
    public string AgendaTitle { get; set; } = string.Empty;

    /// <summary>開始日時</summary>
    public DateTimeOffset StartAt { get; set; }

    /// <summary>終了日時</summary>
    public DateTimeOffset EndAt { get; set; }

    /// <summary>終日フラグ</summary>
    public bool IsAllDay { get; set; }

    /// <summary>場所（任意）</summary>
    public string? Location { get; set; }

    /// <summary>URL（任意）</summary>
    public string? Url { get; set; }

    /// <summary>リマインダーメッセージ（例: 1時間前のリマインダー）</summary>
    public string ReminderMessage { get; set; } = string.Empty;

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>アジェンダ詳細ページ URL</summary>
    public string AgendaUrl { get; set; } = string.Empty;
}

/// <summary>
/// 参加者不参加通知メールテンプレート用モデル
/// </summary>
public class AgendaAttendanceDeclinedEmailModel : EmailTemplateModelBase, IEmailTemplateModel<AgendaAttendanceDeclinedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "agenda-attendance-declined";

    /// <summary>宛先ユーザー名</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>アジェンダタイトル</summary>
    public string AgendaTitle { get; set; } = string.Empty;

    /// <summary>開始日時</summary>
    public DateTimeOffset StartAt { get; set; }

    /// <summary>終了日時</summary>
    public DateTimeOffset EndAt { get; set; }

    /// <summary>終日フラグ</summary>
    public bool IsAllDay { get; set; }

    /// <summary>不参加にした人の名前</summary>
    public string DeclinedByName { get; set; } = string.Empty;

    /// <summary>特定回の不参加か（繰り返しイベントの場合）</summary>
    public bool IsOccurrenceDeclined { get; set; }

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>アジェンダ詳細ページ URL</summary>
    public string AgendaUrl { get; set; } = string.Empty;
}
