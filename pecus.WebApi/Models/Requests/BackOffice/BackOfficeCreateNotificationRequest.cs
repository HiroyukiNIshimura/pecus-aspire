using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.BackOffice;

/// <summary>
/// BackOffice用 システム通知作成リクエスト
/// </summary>
public class BackOfficeCreateNotificationRequest
{
    /// <summary>
    /// 件名
    /// </summary>
    [Required(ErrorMessage = "件名は必須です。")]
    [MaxLength(200, ErrorMessage = "件名は200文字以内で入力してください。")]
    public required string Subject { get; set; }

    /// <summary>
    /// 本文（Markdown形式）
    /// </summary>
    [Required(ErrorMessage = "本文は必須です。")]
    public required string Body { get; set; }

    /// <summary>
    /// 通知種類
    /// </summary>
    [Required(ErrorMessage = "通知種類は必須です。")]
    public required SystemNotificationType Type { get; set; }

    /// <summary>
    /// 公開開始日時
    /// </summary>
    [Required(ErrorMessage = "公開開始日時は必須です。")]
    public required DateTimeOffset PublishAt { get; set; }

    /// <summary>
    /// 公開終了日時（null=無期限）
    /// </summary>
    public DateTimeOffset? EndAt { get; set; }
}
