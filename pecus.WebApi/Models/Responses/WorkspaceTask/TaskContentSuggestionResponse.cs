namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// タスク内容提案レスポンス
/// </summary>
public class TaskContentSuggestionResponse
{
    /// <summary>
    /// 提案されたタスク内容（プレーンテキスト）
    /// </summary>
    public string SuggestedContent { get; set; } = string.Empty;
}