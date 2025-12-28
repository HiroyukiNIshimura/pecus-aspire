using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.BackOffice;

/// <summary>
/// BackOffice用 システム通知リスト項目レスポンス
/// </summary>
public class BackOfficeNotificationListItemResponse
{
    /// <summary>
    /// 通知ID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 件名
    /// </summary>
    [Required]
    public required string Subject { get; set; }

    /// <summary>
    /// 通知種類
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<SystemNotificationType>))]
    public SystemNotificationType? Type { get; set; }

    /// <summary>
    /// 公開開始日時
    /// </summary>
    public DateTimeOffset PublishAt { get; set; }

    /// <summary>
    /// 公開終了日時
    /// </summary>
    public DateTimeOffset? EndAt { get; set; }

    /// <summary>
    /// 配信済みフラグ
    /// </summary>
    public bool IsProcessed { get; set; }

    /// <summary>
    /// 配信日時
    /// </summary>
    public DateTimeOffset? ProcessedAt { get; set; }

    /// <summary>
    /// 削除済みフラグ
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 作成者ユーザー名
    /// </summary>
    public string? CreatedByUserName { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}
