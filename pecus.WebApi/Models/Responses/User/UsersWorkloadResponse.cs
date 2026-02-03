namespace Pecus.Models.Responses.User;

/// <summary>
/// 複数ユーザーの負荷情報レスポンス
/// </summary>
public class UsersWorkloadResponse
{
    /// <summary>
    /// ユーザーID別の負荷情報
    /// </summary>
    public Dictionary<int, UserWorkloadInfo> Workloads { get; set; } = new();
}

/// <summary>
/// ユーザー負荷情報
/// </summary>
public class UserWorkloadInfo
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 期限切れタスク数
    /// </summary>
    public int OverdueCount { get; set; }

    /// <summary>
    /// 今日期限のタスク数
    /// </summary>
    public int DueTodayCount { get; set; }

    /// <summary>
    /// 今週期限のタスク数
    /// </summary>
    public int DueThisWeekCount { get; set; }

    /// <summary>
    /// 未完了タスク総数
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
