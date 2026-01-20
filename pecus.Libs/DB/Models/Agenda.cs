using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// アジェンダエンティティ
/// ワークスペース内の未来の予定・イベントを管理する
/// </summary>
public class Agenda
{
    /// <summary>
    /// ID
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    [Required]
    public int OrganizationId { get; set; }

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
    /// 開始日時（UTC）
    /// </summary>
    [Required]
    public DateTimeOffset StartAt { get; set; }

    /// <summary>
    /// 終了日時（UTC）
    /// </summary>
    [Required]
    public DateTimeOffset EndAt { get; set; }

    /// <summary>
    /// 終日イベントフラグ
    /// </summary>
    public bool IsAllDay { get; set; } = false;

    /// <summary>
    /// 場所（テキスト）
    /// </summary>
    [MaxLength(200)]
    public string? Location { get; set; }

    /// <summary>
    /// オンライン会議URLなど
    /// </summary>
    [MaxLength(2000)]
    public string? Url { get; set; }

    // ===== 繰り返し設定 =====

    /// <summary>
    /// 繰り返しタイプ
    /// </summary>
    public RecurrenceType? RecurrenceType { get; set; }

    /// <summary>
    /// 繰り返し間隔（例: 2週間ごと = Weekly + Interval=2）
    /// </summary>
    public int RecurrenceInterval { get; set; } = 1;

    /// <summary>
    /// 月次（曜日指定）の場合の週番号（1-5, 5=最終週）
    /// </summary>
    public int? RecurrenceWeekOfMonth { get; set; }

    /// <summary>
    /// 繰り返し終了日（null=無期限）
    /// </summary>
    public DateOnly? RecurrenceEndDate { get; set; }

    /// <summary>
    /// 繰り返し終了回数（null=無期限、EndDateと排他）
    /// </summary>
    public int? RecurrenceCount { get; set; }

    // ===== リマインダー =====

    /// <summary>
    /// デフォルトリマインダー（分単位、カンマ区切り: "1440,60" = 1日前と1時間前）
    /// </summary>
    [MaxLength(50)]
    public string? DefaultReminders { get; set; }

    // ===== 中止状態 =====

    /// <summary>
    /// 中止フラグ
    /// </summary>
    public bool IsCancelled { get; set; } = false;

    /// <summary>
    /// 中止理由
    /// </summary>
    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    /// <summary>
    /// 中止日時
    /// </summary>
    public DateTimeOffset? CancelledAt { get; set; }

    /// <summary>
    /// 中止したユーザーID
    /// </summary>
    public int? CancelledByUserId { get; set; }

    // ===== 監査 =====

    /// <summary>
    /// 作成ユーザーID
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL xmin）
    /// </summary>
    public uint RowVersion { get; set; }

    // ===== Navigation Properties =====

    /// <summary>
    /// 組織
    /// </summary>
    public Organization? Organization { get; set; }

    /// <summary>
    /// 作成ユーザー
    /// </summary>
    public User? CreatedByUser { get; set; }

    /// <summary>
    /// 中止したユーザー
    /// </summary>
    public User? CancelledByUser { get; set; }

    /// <summary>
    /// 参加者リスト
    /// </summary>
    public ICollection<AgendaAttendee> Attendees { get; set; } = new List<AgendaAttendee>();

    /// <summary>
    /// 出欠回答リスト
    /// </summary>
    public ICollection<AgendaAttendanceResponse> AttendanceResponses { get; set; } = new List<AgendaAttendanceResponse>();

    /// <summary>
    /// 例外リスト（特定回の中止・変更）
    /// </summary>
    public ICollection<AgendaException> Exceptions { get; set; } = new List<AgendaException>();
}

