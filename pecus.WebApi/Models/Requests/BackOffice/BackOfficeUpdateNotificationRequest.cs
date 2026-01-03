using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.BackOffice;

/// <summary>
/// BackOffice用 システム通知更新リクエスト
/// </summary>
public class BackOfficeUpdateNotificationRequest
{
    /// <summary>
    /// 件名
    /// </summary>
    [MaxLength(200, ErrorMessage = "件名は200文字以内で入力してください。")]
    public string? Subject { get; set; }

    /// <summary>
    /// 本文（Markdown形式）
    /// </summary>
    public string? Body { get; set; }

    /// <summary>
    /// 通知種類
    /// </summary>
    public SystemNotificationType? Type { get; set; }

    /// <summary>
    /// 公開開始日時
    /// </summary>
    public DateTimeOffset? PublishAt { get; set; }

    /// <summary>
    /// 公開終了日時（null=無期限）
    /// </summary>
    public DateTimeOffset? EndAt { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}