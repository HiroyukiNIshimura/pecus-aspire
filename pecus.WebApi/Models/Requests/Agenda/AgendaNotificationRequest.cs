using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Agenda;

/// <summary>
/// 通知一括既読リクエスト
/// </summary>
public class MarkNotificationsReadRequest
{
    /// <summary>
    /// 既読にする通知IDリスト（nullまたは空の場合は全て既読にする）
    /// </summary>
    public List<long>? NotificationIds { get; set; }
}
