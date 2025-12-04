using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Tag;

/// <summary>
/// タグ詳細レスポンス
/// </summary>
public class TagDetailResponse : IConflictModel
{
    /// <summary>
    /// タグID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// タグ名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// アクティブ状態
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// このタグが付与されているアイテム数
    /// </summary>
    public int ItemCount { get; set; }

    /// <summary>
    /// 楽観的ロック用RowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}