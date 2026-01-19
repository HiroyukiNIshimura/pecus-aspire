using System.ComponentModel.DataAnnotations;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// アジェンダ例外エンティティ
/// 繰り返しイベントの特定回の中止や変更を管理する
/// </summary>
public class AgendaException
{
    /// <summary>
    /// ID
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// 親アジェンダID
    /// </summary>
    [Required]
    public long AgendaId { get; set; }

    /// <summary>
    /// 対象の元の開始日時（どの回かを特定）
    /// </summary>
    [Required]
    public DateTimeOffset OriginalStartAt { get; set; }

    /// <summary>
    /// この回は中止か
    /// </summary>
    public bool IsCancelled { get; set; } = false;

    /// <summary>
    /// 中止理由
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
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 作成ユーザーID
    /// </summary>
    [Required]
    public int CreatedByUserId { get; set; }

    // Navigation Properties

    /// <summary>
    /// 親アジェンダ
    /// </summary>
    public Agenda? Agenda { get; set; }

    /// <summary>
    /// 作成ユーザー
    /// </summary>
    public User? CreatedByUser { get; set; }
}
