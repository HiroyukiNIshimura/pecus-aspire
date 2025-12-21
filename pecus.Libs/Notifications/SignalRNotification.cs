using System.Text.Json.Serialization;

namespace Pecus.Libs.Notifications;

/// <summary>
/// Redis Pub/Sub 経由で SignalR 通知を送信するためのメッセージ型。
/// BackFire (Hangfire) から WebApi へ通知を転送する際に使用。
/// </summary>
public record SignalRNotification
{
    /// <summary>
    /// 送信先の SignalR グループ名
    /// 例: "chat:123", "organization:1", "workspace:456"
    /// </summary>
    public required string GroupName { get; init; }

    /// <summary>
    /// イベントタイプ（クライアント側で処理を分岐するためのキー）
    /// 例: "chat:message_received", "chat:typing", "task:updated"
    /// </summary>
    public required string EventType { get; init; }

    /// <summary>
    /// 通知のペイロード（JSON シリアライズ可能な任意のオブジェクト）
    /// </summary>
    public required object Payload { get; init; }

    /// <summary>
    /// 通知の送信元タイプ
    /// </summary>
    public NotificationSourceType SourceType { get; init; } = NotificationSourceType.System;

    /// <summary>
    /// 組織ID（Bot 通知の場合に GenerativeApiVendor チェックで使用）
    /// </summary>
    public int? OrganizationId { get; init; }

    /// <summary>
    /// 通知のタイムスタンプ
    /// </summary>
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// 通知の送信元タイプ
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<NotificationSourceType>))]
public enum NotificationSourceType
{
    /// <summary>
    /// システム通知
    /// </summary>
    System = 0,

    /// <summary>
    /// ユーザーからの通知
    /// </summary>
    User = 1,

    /// <summary>
    /// ChatBot からの通知（GenerativeApiVendor チェック対象）
    /// </summary>
    ChatBot = 2,

    /// <summary>
    /// SystemBot からの通知
    /// </summary>
    SystemBot = 3,
}
