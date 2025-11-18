namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース詳細取得用ジャンル情報
/// </summary>
public class WorkspaceGenreResponse
{
    /// <summary>
    /// ジャンルID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// ジャンルの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? Icon { get; set; }
}