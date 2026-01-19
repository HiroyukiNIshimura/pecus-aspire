using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Agenda;

/// <summary>
/// アジェンダ例外作成リクエスト（特定回の中止・変更）
/// </summary>
public class CreateAgendaExceptionRequest
{
    /// <summary>
    /// 対象の元の開始日時（どの回かを特定）
    /// </summary>
    [Required]
    public DateTimeOffset OriginalStartAt { get; set; }

    /// <summary>
    /// この回を中止するか
    /// </summary>
    public bool IsCancelled { get; set; } = false;

    /// <summary>
    /// 中止理由（IsCancelled=trueの場合）
    /// </summary>
    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    /// <summary>
    /// 変更後の開始日時（時間変更の場合）
    /// </summary>
    public DateTimeOffset? ModifiedStartAt { get; set; }

    /// <summary>
    /// 変更後の終了日時
    /// </summary>
    public DateTimeOffset? ModifiedEndAt { get; set; }

    /// <summary>
    /// 変更後のタイトル
    /// </summary>
    [MaxLength(200)]
    public string? ModifiedTitle { get; set; }

    /// <summary>
    /// 変更後の場所
    /// </summary>
    [MaxLength(200)]
    public string? ModifiedLocation { get; set; }

    /// <summary>
    /// 変更後のURL
    /// </summary>
    [MaxLength(2000)]
    public string? ModifiedUrl { get; set; }

    /// <summary>
    /// 変更後の詳細
    /// </summary>
    public string? ModifiedDescription { get; set; }

    /// <summary>
    /// 参加者へ通知を送信するか
    /// </summary>
    public bool SendNotification { get; set; } = true;
}

/// <summary>
/// アジェンダ例外更新リクエスト
/// </summary>
public class UpdateAgendaExceptionRequest
{
    /// <summary>
    /// この回を中止するか
    /// </summary>
    public bool IsCancelled { get; set; } = false;

    /// <summary>
    /// 中止理由（IsCancelled=trueの場合）
    /// </summary>
    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    /// <summary>
    /// 変更後の開始日時（時間変更の場合）
    /// </summary>
    public DateTimeOffset? ModifiedStartAt { get; set; }

    /// <summary>
    /// 変更後の終了日時
    /// </summary>
    public DateTimeOffset? ModifiedEndAt { get; set; }

    /// <summary>
    /// 変更後のタイトル
    /// </summary>
    [MaxLength(200)]
    public string? ModifiedTitle { get; set; }

    /// <summary>
    /// 変更後の場所
    /// </summary>
    [MaxLength(200)]
    public string? ModifiedLocation { get; set; }

    /// <summary>
    /// 変更後のURL
    /// </summary>
    [MaxLength(2000)]
    public string? ModifiedUrl { get; set; }

    /// <summary>
    /// 変更後の詳細
    /// </summary>
    public string? ModifiedDescription { get; set; }

    /// <summary>
    /// 参加者へ通知を送信するか
    /// </summary>
    public bool SendNotification { get; set; } = true;
}
