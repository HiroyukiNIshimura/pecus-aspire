namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース詳細取得用ユーザー情報
/// </summary>
public class WorkspaceDetailUserResponse
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// アイデンティティアイコン URL
    /// </summary>
    public string? IdentityIconUrl { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }
}
