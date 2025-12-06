using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceTask;

/// <summary>
/// 担当者のタスク負荷チェックリクエスト
/// </summary>
public class CheckAssigneeTaskLoadRequest
{
    /// <summary>
    /// 担当ユーザーID
    /// </summary>
    [Required(ErrorMessage = "担当者は必須です。")]
    [Range(1, int.MaxValue, ErrorMessage = "担当者を選択してください。")]
    public int AssignedUserId { get; set; }

    /// <summary>
    /// 期限日時（ISO 8601 形式）
    /// </summary>
    [Required(ErrorMessage = "期限日は必須です。")]
    public DateTimeOffset DueDate { get; set; }
}
