namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム一覧レスポンス（ページング対応）
/// </summary>
public class WorkspaceItemListResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public int? Priority { get; set; }
    public bool IsDraft { get; set; }
    public bool IsArchived { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public bool IsAssigned { get; set; }
    public Pecus.Models.Responses.Workspace.WorkspaceDetailUserResponse Owner { get; set; } = null!;
}