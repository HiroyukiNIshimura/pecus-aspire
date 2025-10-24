namespace Pecus.Models.Responses.Genre;

/// <summary>
/// ジャンル一覧用レスポンス
/// </summary>
public class GenreListItemResponse
{
    /// <summary>
    /// ジャンルID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
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
    /// 有効フラグ
    /// </summary>
    public bool IsActive { get; set; }
}
