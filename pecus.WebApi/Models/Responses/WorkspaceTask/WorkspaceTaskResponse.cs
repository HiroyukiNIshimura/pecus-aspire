namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// ワークスペースタスク操作レスポンス
/// </summary>
public class WorkspaceTaskResponse
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
    /// ワークスペースタスク情報
    /// </summary>
    public WorkspaceTaskDetailResponse? WorkspaceTask { get; set; }

    /// <summary>
    /// 変更前のワークスペースタスク情報
    /// </summary>
    public WorkspaceTaskDetailResponse? PreviousWorkspaceTask { get; set; }

    /// <summary>
    /// 新規取得バッジ（タスク完了時のみ）
    /// </summary>
    public List<NewAchievementResponse>? NewAchievements { get; set; }
}