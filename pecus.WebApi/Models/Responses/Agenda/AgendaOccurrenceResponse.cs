using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Responses.User;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Agenda;

/// <summary>
/// アジェンダ展開済みオカレンス（一覧用）
/// 繰り返しイベントを展開した各回を表すDTO
/// </summary>
public class AgendaOccurrenceResponse
{
    /// <summary>
    /// 親アジェンダID
    /// </summary>
    public required long AgendaId { get; set; }

    /// <summary>
    /// 例外ID（この回が変更されている場合）
    /// </summary>
    public long? ExceptionId { get; set; }

    /// <summary>
    /// オカレンスのインデックス（0から始まる、何回目かを特定）
    /// </summary>
    public required int OccurrenceIndex { get; set; }

    /// <summary>
    /// この回の開始日時
    /// </summary>
    public required DateTimeOffset StartAt { get; set; }

    /// <summary>
    /// この回の終了日時
    /// </summary>
    public required DateTimeOffset EndAt { get; set; }

    /// <summary>
    /// タイトル（例外で変更されていればその値）
    /// </summary>
    public required string Title { get; set; }

    /// <summary>
    /// 場所
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// URL
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// 終日イベントか
    /// </summary>
    public bool IsAllDay { get; set; }

    /// <summary>
    /// 繰り返しタイプ（単発の場合はnull）
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<RecurrenceType>))]
    public RecurrenceType? RecurrenceType { get; set; }

    /// <summary>
    /// この回は中止されているか
    /// </summary>
    public bool IsCancelled { get; set; }

    /// <summary>
    /// 中止理由
    /// </summary>
    public string? CancellationReason { get; set; }

    /// <summary>
    /// この回のみ変更されているか
    /// </summary>
    public bool IsModified { get; set; }

    /// <summary>
    /// 参加者数
    /// </summary>
    public int AttendeeCount { get; set; }

    /// <summary>
    /// 現在のユーザーの参加状況
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<AttendanceStatus>))]
    public AttendanceStatus? MyAttendanceStatus { get; set; }

    /// <summary>
    /// 作成者
    /// </summary>
    public UserItem? CreatedByUser { get; set; }
}
