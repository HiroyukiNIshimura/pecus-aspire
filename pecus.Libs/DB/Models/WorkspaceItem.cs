namespace Pecus.Libs.DB.Models;

/// <summary>
/// ワークスペース内のアイテムエンティティ
/// </summary>
public class WorkspaceItem
{
    /// <summary>
    /// アイテムID（主キー）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペースID（外部キー）
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// コード（ワークスペース内でユニークなハッシュ文字列）
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 件名
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// 本文（WYSIWYGのノードデータをJSON形式で保存）
    /// </summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// オーナーユーザーID（外部キー）
    /// </summary>
    public int OwnerId { get; set; }

    /// <summary>
    /// 作業中のユーザーID（外部キー、NULL可）
    /// </summary>
    public int? AssigneeId { get; set; }

    /// <summary>
    /// 重要度（1: 低、2: 普通、3: 高）
    /// </summary>
    public int Priority { get; set; } = 2;

    /// <summary>
    /// 期限日
    /// </summary>
    public DateTime DueDate { get; set; }

    /// <summary>
    /// 編集不可フラグ（アーカイブ）
    /// </summary>
    public bool IsArchived { get; set; } = false;

    /// <summary>
    /// 下書き中フラグ
    /// </summary>
    public bool IsDraft { get; set; } = true;

    /// <summary>
    /// コミッターユーザーID（外部キー、NULL可）
    /// </summary>
    public int? CommitterId { get; set; }

    /// <summary>
    /// アイテム内容
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    /// <summary>
    /// ワークスペース（ナビゲーションプロパティ）
    /// </summary>
    public Workspace? Workspace { get; set; }

    /// <summary>
    /// オーナーユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User? Owner { get; set; }

    /// <summary>
    /// 作業中のユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User? Assignee { get; set; }

    /// <summary>
    /// コミッターユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User? Committer { get; set; }

    /// <summary>
    /// このアイテムに付与されているタグとの関連（多対多）
    /// </summary>
    public ICollection<WorkspaceItemTag> WorkspaceItemTags { get; set; } =
        new List<WorkspaceItemTag>();

    /// <summary>
    /// このアイテムをPINしているユーザーとの関連（多対多）
    /// </summary>
    public ICollection<WorkspaceItemPin> WorkspaceItemPins { get; set; } =
        new List<WorkspaceItemPin>();

    /// <summary>
    /// このアイテムに添付されているファイル
    /// </summary>
    public ICollection<WorkspaceItemAttachment> WorkspaceItemAttachments { get; set; } =
        new List<WorkspaceItemAttachment>();

    /// <summary>
    /// このアイテムから他のアイテムへの関連（このアイテムが関連元）
    /// </summary>
    public ICollection<WorkspaceItemRelation> RelationsFrom { get; set; } =
        new List<WorkspaceItemRelation>();

    /// <summary>
    /// 他のアイテムからこのアイテムへの関連（このアイテムが関連先）
    /// </summary>
    public ICollection<WorkspaceItemRelation> RelationsTo { get; set; } =
        new List<WorkspaceItemRelation>();
}
