using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.User;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Agenda;

public class AgendaResponse : IConflictModel
{
    [Required]
    public required long Id { get; set; }
    [Required]
    public required int OrganizationId { get; set; }
    [Required]
    public required string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Required]
    public required DateTimeOffset StartAt { get; set; }
    [Required]
    public required DateTimeOffset EndAt { get; set; }
    [Required]
    public required bool IsAllDay { get; set; }
    public string? Location { get; set; }
    public string? Url { get; set; }

    // ===== 繰り返し設定 =====

    /// <summary>
    /// 繰り返しタイプ
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<RecurrenceType>))]
    public RecurrenceType? RecurrenceType { get; set; }

    /// <summary>
    /// 繰り返し間隔
    /// </summary>
    public int RecurrenceInterval { get; set; } = 1;

    /// <summary>
    /// 月次（曜日指定）の場合の週番号
    /// </summary>
    public int? RecurrenceWeekOfMonth { get; set; }

    /// <summary>
    /// 繰り返し終了日
    /// </summary>
    public DateOnly? RecurrenceEndDate { get; set; }

    /// <summary>
    /// 繰り返し終了回数
    /// </summary>
    public int? RecurrenceCount { get; set; }

    // ===== リマインダー =====

    /// <summary>
    /// デフォルトリマインダー（分単位のリスト）
    /// </summary>
    public List<int>? Reminders { get; set; }

    // ===== 中止状態 =====

    /// <summary>
    /// 中止フラグ
    /// </summary>
    public bool IsCancelled { get; set; }

    /// <summary>
    /// 中止理由
    /// </summary>
    public string? CancellationReason { get; set; }

    /// <summary>
    /// 中止日時
    /// </summary>
    public DateTimeOffset? CancelledAt { get; set; }

    /// <summary>
    /// 中止したユーザー
    /// </summary>
    public UserItem? CancelledByUser { get; set; }

    // ===== 監査情報 =====

    public required int CreatedByUserId { get; set; }
    [Required]
    public required DateTimeOffset CreatedAt { get; set; }
    [Required]
    public required DateTimeOffset UpdatedAt { get; set; }
    [Required]
    public uint RowVersion { get; set; }

    public UserItem? CreatedByUser { get; set; }
    public List<AgendaAttendeeResponse> Attendees { get; set; } = new();
}
