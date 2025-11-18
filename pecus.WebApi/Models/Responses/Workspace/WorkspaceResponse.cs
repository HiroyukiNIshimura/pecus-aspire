namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース操作レスポンス
/// </summary>
public class WorkspaceResponse
{
    /// <summary>
    /// 成功フラグ
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// メッセージ
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// ワークスペース詳細情報
    /// </summary>
    public WorkspaceDetailResponse? Workspace { get; set; }
}