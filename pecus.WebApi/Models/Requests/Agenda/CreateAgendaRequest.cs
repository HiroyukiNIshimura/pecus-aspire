using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Requests.Agenda;

public class CreateAgendaRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public DateTimeOffset StartAt { get; set; }

    [Required]
    public DateTimeOffset EndAt { get; set; }

    public bool IsAllDay { get; set; } = false;

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(2000)]
    public string? Url { get; set; }

    // ===== 繰り返し設定 =====

    /// <summary>
    /// 繰り返しタイプ（null = 単発イベント）
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<RecurrenceType>))]
    public RecurrenceType? RecurrenceType { get; set; }

    /// <summary>
    /// 繰り返し間隔（例: 2週間ごと = Weekly + Interval=2）
    /// </summary>
    [Range(1, 99)]
    public int RecurrenceInterval { get; set; } = 1;

    /// <summary>
    /// 月次（曜日指定）の場合の週番号（1-5, 5=最終週）
    /// </summary>
    [Range(1, 5)]
    public int? RecurrenceWeekOfMonth { get; set; }

    /// <summary>
    /// 繰り返し終了日（null=無期限、RecurrenceCountと排他）
    /// </summary>
    public DateOnly? RecurrenceEndDate { get; set; }

    /// <summary>
    /// 繰り返し終了回数（null=無期限、RecurrenceEndDateと排他）
    /// </summary>
    [Range(1, 999)]
    public int? RecurrenceCount { get; set; }

    // ===== リマインダー =====

    /// <summary>
    /// リマインダー設定（分単位のリスト: 1440=1日前, 60=1時間前など）
    /// </summary>
    public List<int>? Reminders { get; set; }

    // ===== 参加者 =====

    /// <summary>
    /// 参加者リスト
    /// </summary>
    public List<AgendaAttendeeRequest> Attendees { get; set; } = new();

    /// <summary>
    /// 作成時に参加者へ通知を送信するか
    /// </summary>
    public bool SendNotification { get; set; } = true;
}

public class AgendaAttendeeRequest
{
    public int UserId { get; set; }
    public bool IsOptional { get; set; } = false;
}
