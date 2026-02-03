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

    // ===== 負荷状況の詳細情報（拡張） =====

    /// <summary>
    /// 期限切れタスク数（組織全体）
    /// </summary>
    public int OverdueCount { get; set; }

    /// <summary>
    /// 今日期限のタスク数（組織全体）
    /// </summary>
    public int DueTodayCount { get; set; }

    /// <summary>
    /// 今週期限のタスク数（組織全体）
    /// </summary>
    public int DueThisWeekCount { get; set; }

    /// <summary>
    /// 未完了タスク総数（組織全体）
    /// </summary>
    public int TotalActiveCount { get; set; }

    /// <summary>
    /// 担当中のアイテム数（コンテキストスイッチ指標）
    /// </summary>
    public int ActiveItemCount { get; set; }

    /// <summary>
    /// 担当中のワークスペース数（コンテキストスイッチ指標）
    /// </summary>
    public int ActiveWorkspaceCount { get; set; }

    /// <summary>
    /// 負荷レベル: Low, Medium, High, Overloaded
    /// </summary>
    public string WorkloadLevel { get; set; } = "Low";
}