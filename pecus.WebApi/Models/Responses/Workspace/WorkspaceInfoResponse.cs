namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース情報レスポンス（簡易版）
/// </summary>
public class WorkspaceInfoResponse
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }
}
