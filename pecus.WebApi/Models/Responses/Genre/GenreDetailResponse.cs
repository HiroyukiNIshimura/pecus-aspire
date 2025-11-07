using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Genre;

/// <summary>
/// ジャンル詳細レスポンス
/// </summary>
public class GenreDetailResponse
{
    /// <summary>
    /// ジャンルID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// ジャンルの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// このジャンルを使用しているワークスペース数
    /// </summary>
    public int WorkspaceCount { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int? CreatedByUserId { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// 有効フラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public required byte[] RowVersion { get; set; }
}
