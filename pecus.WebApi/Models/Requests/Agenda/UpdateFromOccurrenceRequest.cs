using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Requests.Agenda;

/// <summary>
/// 「この回以降」更新リクエスト（シリーズ分割）
/// </summary>
/// <remarks>
/// 指定された回を境にシリーズを分割し、新しいシリーズとして変更を適用します。
/// 元のシリーズは分割地点の前日で終了となります。
/// </remarks>
public class UpdateFromOccurrenceRequest
{
    /// <summary>
    /// 分割起点となる回のインデックス（0から始まる）
    /// </summary>
    [Required]
    public int FromOccurrenceIndex { get; set; }

    /// <summary>
    /// タイトル
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 詳細（Markdown対応）
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 新しいシリーズの開始日時
    /// </summary>
    [Required]
    public DateTimeOffset StartAt { get; set; }

    /// <summary>
    /// 新しいシリーズの終了日時
    /// </summary>
    [Required]
    public DateTimeOffset EndAt { get; set; }

    /// <summary>
    /// 終日フラグ
    /// </summary>
    public bool IsAllDay { get; set; }

    /// <summary>
    /// 場所
    /// </summary>
    [MaxLength(200)]
    public string? Location { get; set; }

    /// <summary>
    /// URL
    /// </summary>
    [MaxLength(2000)]
    public string? Url { get; set; }

    /// <summary>
    /// 繰り返しタイプ
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<RecurrenceType>))]
    public RecurrenceType? RecurrenceType { get; set; }

    /// <summary>
    /// 繰り返し間隔
    /// </summary>
    [Range(1, 365)]
    public int RecurrenceInterval { get; set; } = 1;

    /// <summary>
    /// 月次曜日指定時の週番号（1-5）
    /// </summary>
    [Range(1, 5)]
    public int? RecurrenceWeekOfMonth { get; set; }

    /// <summary>
    /// 繰り返し終了日
    /// </summary>
    public DateOnly? RecurrenceEndDate { get; set; }

    /// <summary>
    /// 繰り返し回数
    /// </summary>
    [Range(1, 999)]
    public int? RecurrenceCount { get; set; }

    /// <summary>
    /// リマインダー（分単位のリスト）
    /// </summary>
    public List<int>? Reminders { get; set; }

    /// <summary>
    /// 参加者リスト（指定しない場合は元のシリーズから引き継ぎ）
    /// </summary>
    public List<AgendaAttendeeRequest>? Attendees { get; set; }

    /// <summary>
    /// 変更通知を送信するか
    /// </summary>
    public bool SendNotification { get; set; } = true;
}
