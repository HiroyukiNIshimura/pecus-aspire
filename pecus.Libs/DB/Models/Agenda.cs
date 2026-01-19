using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    // Navigation Properties

    /// <summary>
    /// 組織
    /// </summary>
    public Organization? Organization { get; set; }

    /// <summary>
    ///  作成ユーザー
    /// </summary>
    /// <value></value>
    public User? CreatedByUser { get; set; }

    /// <summary>
    /// 参加者リスト
    /// </summary>
    public ICollection<AgendaAttendee> Attendees { get; set; } = new List<AgendaAttendee>();
}
