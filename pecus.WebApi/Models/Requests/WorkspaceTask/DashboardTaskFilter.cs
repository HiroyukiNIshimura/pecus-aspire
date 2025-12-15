namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// ダッシュボード用タスクフィルター
/// マイタスク・コミッターダッシュボードで使用するフィルター種別
/// </summary>
public enum DashboardTaskFilter
{
    /// <summary>
    /// アクティブなタスク（未完了かつ破棄されていない）
    /// </summary>
    Active,

    /// <summary>
    /// 完了したタスク
    /// </summary>
    Completed,

    /// <summary>
    /// 期限超過のタスク（未完了かつ期限日が過去）
    /// </summary>
    Overdue,

    /// <summary>
    /// ヘルプコメントがあるタスク
    /// </summary>
    HelpWanted,

    /// <summary>
    /// 督促コメントがあるタスク
    /// </summary>
    Reminder,
}