using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Master;

/// <summary>
/// マスターデータ用ジャンルレスポンス
/// </summary>
public class MasterGenreResponse
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
}
