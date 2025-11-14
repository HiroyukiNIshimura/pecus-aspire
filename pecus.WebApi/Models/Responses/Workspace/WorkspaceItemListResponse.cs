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
    public WorkspaceDetailUserResponse Owner { get; set; } = null!;
}
