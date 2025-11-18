namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース詳細情報（一般ユーザー用）
/// </summary>
public class WorkspaceFullDetailResponse : WorkspaceBaseResponse
{
    /// <summary>
    /// メンバー一覧
    /// </summary>
    public new List<WorkspaceDetailUserResponse> Members { get; set; } = [];

    /// <summary>
    /// 作成ユーザー（無効なユーザーでも含む）
    /// </summary>
    public WorkspaceDetailUserResponse CreatedBy { get; set; } = null!;

    /// <summary>
    /// 更新ユーザー（無効なユーザーでも含む）
    /// </summary>
    public WorkspaceDetailUserResponse UpdatedBy { get; set; } = null!;
}