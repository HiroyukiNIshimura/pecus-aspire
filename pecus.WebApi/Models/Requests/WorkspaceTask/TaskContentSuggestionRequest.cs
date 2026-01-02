using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// タスク内容提案リクエスト
/// </summary>
public class TaskContentSuggestionRequest
{
    /// <summary>
    /// タスク種類ID
    /// </summary>
    [Required(ErrorMessage = "タスクの種類は必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "タスクの種類を選択してください。")]
    public required int TaskTypeId { get; set; }
}
