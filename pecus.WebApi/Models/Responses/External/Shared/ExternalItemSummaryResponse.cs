using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用アイテムサマリーレスポンス（一覧用）
/// </summary>
public class ExternalItemSummaryResponse
{
    /// <summary>
    /// アイテム番号（ワークスペース内の連番）
    /// </summary>
    [Required]
    public int ItemNumber { get; set; }

    /// <summary>
    /// 件名
    /// </summary>
    [Required]
    public required string Subject { get; set; }

    /// <summary>
    /// タグ（タグ名一覧）
    /// </summary>
    [Required]
    public required IReadOnlyList<string> Tags { get; set; }

    /// <summary>
    /// オーナーユーザー
    /// </summary>
    [Required]
    public required ExternalUserRefResponse Owner { get; set; }

    /// <summary>
    /// 担当ユーザー
    /// </summary>
    public ExternalUserRefResponse? AssignedUser { get; set; }

    /// <summary>
    /// コミッターユーザー
    /// </summary>
    public ExternalUserRefResponse? Committer { get; set; }

    /// <summary>
    /// 期限日時
    /// </summary>
    public DateTimeOffset? DueDate { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    [Required]
    public bool IsActive { get; set; }

    /// <summary>
    /// アーカイブフラグ
    /// </summary>
    [Required]
    public bool IsArchived { get; set; }

    /// <summary>
    /// 下書きフラグ
    /// </summary>
    [Required]
    public bool IsDraft { get; set; }
}