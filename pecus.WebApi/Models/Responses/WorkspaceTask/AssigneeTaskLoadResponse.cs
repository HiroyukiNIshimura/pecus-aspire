namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// 担当者の期限日別タスク負荷レスポンス
/// </summary>
public class AssigneeTaskLoadResponse
{
    /// <summary>
    /// 担当ユーザーID
    /// </summary>
    public int AssignedUserId { get; set; }

    /// <summary>
    /// 期限日（UTC, 日単位）
    /// </summary>
    public DateTimeOffset DueDate { get; set; }

    /// <summary>
    /// しきい値（組織設定 TaskOverdueThreshold）
    /// </summary>
    public int Threshold { get; set; }

    /// <summary>
    /// 現在の未完了・未破棄タスク数
    /// </summary>
    public int ActiveTaskCount { get; set; }

    /// <summary>
    /// 新規作成を含めた想定タスク数
    /// </summary>
    public int ProjectedTaskCount { get; set; }

    /// <summary>
    /// しきい値を超過しているか
    /// </summary>
    public bool IsExceeded { get; set; }
}