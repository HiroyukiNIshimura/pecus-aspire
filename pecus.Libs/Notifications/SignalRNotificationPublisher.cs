using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;

namespace Pecus.Libs.Notifications;

/// <summary>
/// Redis Pub/Sub 経由で SignalR 通知を Publish するヘルパークラス。
/// BackFire (Hangfire) や他のサービスから WebApi へ通知を送信する際に使用。
/// </summary>
public class SignalRNotificationPublisher
{
    /// <summary>
    /// Redis Pub/Sub のチャンネル名
    /// </summary>
    public const string ChannelName = "coati:signalr:notifications";

    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<SignalRNotificationPublisher> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    /// <summary>
    /// SignalRNotificationPublisher のコンストラクタ
    /// </summary>
    /// <param name="redis">Redis 接続</param>
    /// <param name="logger">ロガー</param>
    public SignalRNotificationPublisher(
        IConnectionMultiplexer redis,
        ILogger<SignalRNotificationPublisher> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    /// <summary>
    /// SignalR 通知を Redis Pub/Sub 経由で送信する。
    /// </summary>
    /// <param name="notification">送信する通知</param>
    /// <returns>受信したサブスクライバーの数</returns>
    public async Task<long> PublishAsync(SignalRNotification notification)
    {
        try
        {
            var subscriber = _redis.GetSubscriber();
            var json = JsonSerializer.Serialize(notification, JsonOptions);

            var receiverCount = await subscriber.PublishAsync(
                RedisChannel.Literal(ChannelName),
                json
            );

            _logger.LogDebug(
                "Published SignalR notification: EventType={EventType}, GroupName={GroupName}, Receivers={ReceiverCount}",
                notification.EventType,
                notification.GroupName,
                receiverCount
            );

            return receiverCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to publish SignalR notification: EventType={EventType}, GroupName={GroupName}",
                notification.EventType,
                notification.GroupName
            );
            throw;
        }
    }

    /// <summary>
    /// ChatBot からのメッセージ通知を送信する。
    /// WebApi 側で GenerativeApiVendor のチェックが行われる。
    /// </summary>
    /// <param name="organizationId">組織ID（GenerativeApiVendor チェック用）</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="eventType">イベントタイプ</param>
    /// <param name="payload">通知ペイロード</param>
    public async Task<long> PublishChatBotNotificationAsync(
        int organizationId,
        int roomId,
        string eventType,
        object payload)
    {
        var notification = new SignalRNotification
        {
            GroupName = $"chat:{roomId}",
            EventType = eventType,
            Payload = payload,
            SourceType = NotificationSourceType.ChatBot,
            OrganizationId = organizationId,
        };

        return await PublishAsync(notification);
    }

    /// <summary>
    /// SystemBot からの通知を送信する。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="eventType">イベントタイプ</param>
    /// <param name="payload">通知ペイロード</param>
    public async Task<long> PublishSystemBotNotificationAsync(
        int organizationId,
        int roomId,
        string eventType,
        object payload)
    {
        var notification = new SignalRNotification
        {
            GroupName = $"chat:{roomId}",
            EventType = eventType,
            Payload = payload,
            SourceType = NotificationSourceType.SystemBot,
            OrganizationId = organizationId,
        };

        return await PublishAsync(notification);
    }

    /// <summary>
    /// 汎用的な通知を送信する。
    /// </summary>
    /// <param name="groupName">SignalR グループ名</param>
    /// <param name="eventType">イベントタイプ</param>
    /// <param name="payload">通知ペイロード</param>
    public async Task<long> PublishNotificationAsync(
        string groupName,
        string eventType,
        object payload)
    {
        var notification = new SignalRNotification
        {
            GroupName = groupName,
            EventType = eventType,
            Payload = payload,
            SourceType = NotificationSourceType.System,
        };

        return await PublishAsync(notification);
    }

    /// <summary>
    /// ChatBot の入力中通知を送信する。
    /// AI が応答を生成中であることをクライアントに通知。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="botActorId">Bot のアクターID</param>
    /// <param name="botName">Bot 名</param>
    /// <param name="isTyping">入力中かどうか</param>
    public async Task<long> PublishChatBotTypingAsync(
        int organizationId,
        int roomId,
        int botActorId,
        string botName,
        bool isTyping)
    {
        var payload = new
        {
            RoomId = roomId,
            BotActorId = botActorId,
            BotName = botName,
            IsTyping = isTyping,
        };

        return await PublishChatBotNotificationAsync(
            organizationId,
            roomId,
            "chat:bot_typing",
            payload);
    }

    /// <summary>
    /// ChatBot のエラー通知を送信する。
    /// AI 応答生成に失敗した場合にクライアントに通知。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="botActorId">Bot のアクターID</param>
    /// <param name="botName">Bot 名</param>
    /// <param name="errorMessage">エラーメッセージ</param>
    public async Task<long> PublishChatBotErrorAsync(
        int organizationId,
        int roomId,
        int botActorId,
        string botName,
        string errorMessage)
    {
        var payload = new
        {
            RoomId = roomId,
            BotActorId = botActorId,
            BotName = botName,
            ErrorMessage = errorMessage,
        };

        return await PublishChatBotNotificationAsync(
            organizationId,
            roomId,
            "chat:bot_error",
            payload);
    }
}