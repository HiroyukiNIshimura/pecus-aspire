namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペースユーザー詳細レスポンス
/// </summary>
public class WorkspaceUserDetailResponse
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// ワークスペース内での役割
    /// </summary>
    public string? WorkspaceRole { get; set; }

    /// <summary>
    /// 参加日時
    /// </summary>
    public DateTime JoinedAt { get; set; }

    /// <summary>
    /// 最終アクセス日時
    /// </summary>
    public DateTime? LastAccessedAt { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }
}

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

