namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペースメンバーが担当しているタスク/アイテムの情報
/// Viewer変更前のチェック用
/// </summary>
public class WorkspaceMemberAssignmentsResponse
{
    /// <summary>未完了タスク担当（タスク詳細へのリンク用）</summary>
    public List<AssignedTaskInfo> AssignedTasks { get; set; } = [];

    /// <summary>アイテム担当者（アイテム詳細へのリンク用）</summary>
    public List<AssignedItemInfo> AssignedItems { get; set; } = [];

    /// <summary>コミッター（アイテム詳細へのリンク用）</summary>
    public List<AssignedItemInfo> CommitterItems { get; set; } = [];

    /// <summary>オーナー（アイテム詳細へのリンク用）</summary>
    public List<AssignedItemInfo> OwnerItems { get; set; } = [];

    /// <summary>担当があるかどうか</summary>
    public bool HasAssignments =>
        AssignedTasks.Count > 0
        || AssignedItems.Count > 0
        || CommitterItems.Count > 0
        || OwnerItems.Count > 0;
}

/// <summary>
/// 担当タスク情報（リンク生成用）
/// </summary>
public class AssignedTaskInfo
{
    /// <summary>タスクID</summary>
    public int TaskId { get; set; }

    /// <summary>タスクシーケンス番号（T-123 形式表示用）</summary>
    public int TaskSequence { get; set; }

    /// <summary>タスク内容（省略表示用）</summary>
    public string TaskContent { get; set; } = "";

    /// <summary>所属アイテムID</summary>
    public int ItemId { get; set; }

    /// <summary>所属アイテム番号</summary>
    public int ItemNumber { get; set; }

    /// <summary>所属アイテム件名（どのアイテムのタスクか分かるように）</summary>
    public string ItemSubject { get; set; } = "";

    /// <summary>ワークスペースコード（URL生成用）</summary>
    public string WorkspaceCode { get; set; } = "";
}

/// <summary>
/// 担当アイテム情報（リンク生成用）
/// </summary>
public class AssignedItemInfo
{
    /// <summary>アイテムID</summary>
    public int ItemId { get; set; }

    /// <summary>アイテム番号（I-456 形式表示用）</summary>
    public int ItemNumber { get; set; }

    /// <summary>アイテム件名</summary>
    public string ItemSubject { get; set; } = "";

    /// <summary>ワークスペースコード（URL生成用）</summary>
    public string WorkspaceCode { get; set; } = "";
}
