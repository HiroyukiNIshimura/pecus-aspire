using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Focus;

/// <summary>
/// フォーカス推奨レスポンス
/// </summary>
public class FocusRecommendationResponse
{
    /// <summary>
    /// 今すぐ取り組むべきタスク（先行タスクなし or 完了済み、スコア上位）
    /// </summary>
    [Required]
    public required List<FocusTaskResponse> FocusTasks { get; set; }

    /// <summary>
    /// 今は着手できないタスク（先行タスク未完了）
    /// </summary>
    [Required]
    public required List<FocusTaskResponse> WaitingTasks { get; set; }

    /// <summary>
    /// 対象タスクの総数
    /// </summary>
    [Required]
    public required int TotalTaskCount { get; set; }

    /// <summary>
    /// レスポンス生成日時
    /// </summary>
    [Required]
    public required DateTimeOffset GeneratedAt { get; set; }
}