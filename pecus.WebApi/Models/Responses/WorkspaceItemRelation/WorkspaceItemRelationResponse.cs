namespace Pecus.Models.Responses.WorkspaceItemRelation;

/// <summary>
/// ワークスペースアイテム関連情報レスポンス
/// </summary>
public class WorkspaceItemRelationResponse
{
    /// <summary>
    /// 関連ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 関連元アイテムID
    /// </summary>
    public int FromItemId { get; set; }

    /// <summary>
    /// 関連元アイテムコード
    /// </summary>
    public string FromItemCode { get; set; } = string.Empty;

    /// <summary>
    /// 関連元アイテム件名
    /// </summary>
    public string FromItemSubject { get; set; } = string.Empty;

    /// <summary>
    /// 関連先アイテムID
    /// </summary>
    public int ToItemId { get; set; }

    /// <summary>
    /// 関連先アイテムコード
    /// </summary>
    public string ToItemCode { get; set; } = string.Empty;

    /// <summary>
    /// 関連先アイテム件名
    /// </summary>
    public string ToItemSubject { get; set; } = string.Empty;

    /// <summary>
    /// 関連タイプ
    /// </summary>
    public string? RelationType { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作成者ID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成者ユーザー名
    /// </summary>
    public string CreatedByUsername { get; set; } = string.Empty;
}

/// <summary>
/// ワークスペースアイテム関連追加レスポンス
/// </summary>
public class AddWorkspaceItemRelationResponse
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
    /// 関連情報
    /// </summary>
    public WorkspaceItemRelationResponse? Relation { get; set; }
}

/// <summary>
/// ワークスペースアイテム関連一覧レスポンス
/// </summary>
public class WorkspaceItemRelationsResponse
{
    /// <summary>
    /// 関連元としての関連一覧（このアイテムから他へ）
    /// </summary>
    public List<WorkspaceItemRelationResponse> RelationsFrom { get; set; } = new();

    /// <summary>
    /// 関連先としての関連一覧（他からこのアイテムへ）
    /// </summary>
    public List<WorkspaceItemRelationResponse> RelationsTo { get; set; } = new();

    /// <summary>
    /// 全関連数
    /// </summary>
    public int TotalCount { get; set; }
}
