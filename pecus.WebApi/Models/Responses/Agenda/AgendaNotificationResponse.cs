using Pecus.Libs.DB.Models.Enums;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Agenda;

/// <summary>
/// アジェンダ通知レスポンス
/// </summary>
public class AgendaNotificationResponse
{
    /// <summary>
    /// 通知ID
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// アジェンダID
    /// </summary>
    public long AgendaId { get; set; }

    /// <summary>
    /// アジェンダタイトル
    /// </summary>
    public required string AgendaTitle { get; set; }

    /// <summary>
    /// 通知タイプ
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<AgendaNotificationType>))]
    public AgendaNotificationType Type { get; set; }

    /// <summary>
    /// 対象回の開始日時（繰り返しイベントの特定回への通知の場合）
    /// </summary>
    public DateTimeOffset? OccurrenceStartAt { get; set; }

    /// <summary>
    /// 通知メッセージ
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// 既読フラグ
    /// </summary>
    public bool IsRead { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 通知を作成したユーザー（招待者、変更者など）
    /// </summary>
    public UserIdentityResponse? CreatedBy { get; set; }
}

/// <summary>
/// アジェンダ通知件数レスポンス（ヘッダーバッジ用）
/// </summary>
public class AgendaNotificationCountResponse
{
    /// <summary>
    /// 未回答の招待数
    /// </summary>
    public int PendingInvitations { get; set; }

    /// <summary>
    /// 未読通知数
    /// </summary>
    public int UnreadNotifications { get; set; }

    /// <summary>
    /// 合計
    /// </summary>
    public int Total => PendingInvitations + UnreadNotifications;
}
