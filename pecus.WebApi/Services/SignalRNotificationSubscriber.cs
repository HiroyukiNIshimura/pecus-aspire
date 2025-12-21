using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pecus.Hubs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;
using StackExchange.Redis;
using System.Text.Json;

namespace Pecus.Services;

/// <summary>
/// Redis Pub/Sub を購読し、受信した通知を SignalR 経由でクライアントに転送する BackgroundService。
/// BackFire (Hangfire) からの通知を WebApi 経由で SignalR に送信する役割を担う。
/// </summary>
public class SignalRNotificationSubscriber : BackgroundService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SignalRNotificationSubscriber> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public SignalRNotificationSubscriber(
        IConnectionMultiplexer redis,
        IHubContext<NotificationHub> hubContext,
        IServiceScopeFactory scopeFactory,
        ILogger<SignalRNotificationSubscriber> logger)
    {
        _redis = redis;
        _hubContext = hubContext;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SignalRNotificationSubscriber starting...");

        try
        {
            var subscriber = _redis.GetSubscriber();

            await subscriber.SubscribeAsync(
                RedisChannel.Literal(SignalRNotificationPublisher.ChannelName),
                async (channel, message) =>
                {
                    if (message.IsNullOrEmpty)
                    {
                        return;
                    }

                    await ProcessNotificationAsync(message!);
                }
            );

            _logger.LogInformation(
                "SignalRNotificationSubscriber subscribed to channel: {Channel}",
                SignalRNotificationPublisher.ChannelName
            );

            // キャンセルされるまで待機
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("SignalRNotificationSubscriber stopping...");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SignalRNotificationSubscriber encountered an error");
            throw;
        }
    }

    private async Task ProcessNotificationAsync(string messageJson)
    {
        try
        {
            var notification = JsonSerializer.Deserialize<SignalRNotification>(messageJson, JsonOptions);
            if (notification == null)
            {
                _logger.LogWarning("Failed to deserialize SignalR notification: {Message}", messageJson);
                return;
            }

            // ChatBot からの通知の場合、GenerativeApiVendor をチェック
            if (notification.SourceType == NotificationSourceType.ChatBot)
            {
                if (!notification.OrganizationId.HasValue)
                {
                    _logger.LogWarning(
                        "ChatBot notification missing OrganizationId, skipping: {EventType}",
                        notification.EventType
                    );
                    return;
                }

                var shouldProcess = await ShouldProcessChatBotNotificationAsync(notification.OrganizationId.Value);
                if (!shouldProcess)
                {
                    _logger.LogDebug(
                        "ChatBot notification skipped (GenerativeApiVendor=None): OrganizationId={OrganizationId}, EventType={EventType}",
                        notification.OrganizationId,
                        notification.EventType
                    );
                    return;
                }
            }

            // SignalR グループに送信
            await _hubContext.Clients.Group(notification.GroupName)
                .SendAsync("ReceiveNotification", new
                {
                    eventType = notification.EventType,
                    payload = notification.Payload,
                    timestamp = notification.Timestamp,
                });

            _logger.LogDebug(
                "Forwarded notification to SignalR: EventType={EventType}, GroupName={GroupName}",
                notification.EventType,
                notification.GroupName
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process SignalR notification: {Message}", messageJson);
        }
    }

    /// <summary>
    /// ChatBot からの通知を処理すべきかどうかを判定する。
    /// GenerativeApiVendor が None の場合は false を返す。
    /// </summary>
    private async Task<bool> ShouldProcessChatBotNotificationAsync(int organizationId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var setting = await context.OrganizationSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

            if (setting == null)
            {
                _logger.LogWarning(
                    "OrganizationSetting not found for OrganizationId={OrganizationId}",
                    organizationId
                );
                return false;
            }

            return setting.GenerativeApiVendor != GenerativeApiVendor.None;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to check GenerativeApiVendor for OrganizationId={OrganizationId}",
                organizationId
            );
            return false;
        }
    }
}
