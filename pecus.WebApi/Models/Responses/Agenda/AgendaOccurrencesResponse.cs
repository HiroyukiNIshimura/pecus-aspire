using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Agenda;

/// <summary>
/// アジェンダオカレンス一覧レスポンス（ページネーション対応）
/// </summary>
public class AgendaOccurrencesResponse
{
    /// <summary>
    /// オカレンス一覧
    /// </summary>
    [Required]
    public required List<AgendaOccurrenceResponse> Items { get; set; }

    /// <summary>
    /// 次ページカーソル（最後のオカレンスのStartAt、null の場合は最後のページ）
    /// </summary>
    public DateTimeOffset? NextCursor { get; set; }

    /// <summary>
    /// さらにオカレンスがあるか
    /// </summary>
    public bool HasMore => NextCursor.HasValue;
}
