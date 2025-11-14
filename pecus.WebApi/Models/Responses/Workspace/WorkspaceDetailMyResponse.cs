namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペースアイテム一覧レスポンス（ページング対応）
/// </summary>
public class WorkspaceItemListResponse
{
    /// <summary>
    /// アイテムID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// アイテムコード
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 件名
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// 重要度（NULL の場合は Medium として扱う）
    /// </summary>
    public int? Priority { get; set; }

    /// <summary>
    /// 下書き中フラグ
    /// </summary>
    public bool IsDraft { get; set; }

    /// <summary>
    /// 編集不可フラグ（アーカイブ）
    /// </summary>
    public bool IsArchived { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作業中かどうか（作業中のユーザーID が存在するかで判定）
    /// </summary>
    public bool IsAssigned { get; set; }

    /// <summary>
    /// オーナー情報
    /// </summary>
    public WorkspaceUserInfoResponse Owner { get; set; } = null!;
}

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

/// <summary>
/// ワークスペース詳細取得用ユーザー情報
/// </summary>
public class WorkspaceUserInfoResponse
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

/// <summary>
/// ワークスペース詳細情報
/// </summary>
public class WorkspaceFullDetailResponse
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペースの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作成ユーザー（無効なユーザーでも含む）
    /// </summary>
    public WorkspaceUserInfoResponse CreatedBy { get; set; } = null!;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新ユーザー（無効なユーザーでも含む）
    /// </summary>
    public WorkspaceUserInfoResponse UpdatedBy { get; set; } = null!;

    /// <summary>
    /// ジャンル情報
    /// </summary>
    public WorkspaceGenreResponse? Genre { get; set; }

    /// <summary>
    /// このワークスペースに参加しているユーザー（有効ユーザーのみ）
    /// </summary>
    public List<WorkspaceUserInfoResponse> Members { get; set; } = [];
}

/// <summary>
/// ワークスペースアイテム一覧ページングレスポンス
/// </summary>
public class WorkspaceItemListPagedResponse
{
    /// <summary>
    /// 現在のページ
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// 総ページ数
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// 総アイテム数
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// アイテムデータ
    /// </summary>
    public List<WorkspaceItemListResponse> Data { get; set; } = [];
}
