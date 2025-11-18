namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペースユーザー登録レスポンス
/// </summary>
public class WorkspaceUserResponse
{
    /// <summary>
    /// 成功フラグ
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// メッセージ
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペースユーザー情報
    /// </summary>
    public WorkspaceUserDetailResponse? WorkspaceUser { get; set; }
}