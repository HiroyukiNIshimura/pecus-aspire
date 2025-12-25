using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// グループチャット投稿時に Bot が返信を生成する Hangfire タスク
/// ユーザーからのメッセージに対してワークスペースグループチャットに返信を送信する
/// </summary>
public class GroupChatReplyTask : GroupChatReplyTaskBase
{
    private readonly IBotSelector? _botSelector;
    private readonly IBotBehaviorSelector? _behaviorSelector;
    private readonly IRoomReplyLock? _roomReplyLock;

    /// <summary>
    /// ロックの有効期限（タスク処理の最大時間を想定）
    /// </summary>
    private static readonly TimeSpan LockTtl = TimeSpan.FromMinutes(2);

    /// <summary>
    /// GroupChatReplyTask のコンストラクタ
    /// </summary>
    public GroupChatReplyTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        IAiClientFactory aiClientFactory,
        ILogger<GroupChatReplyTask> logger,
        IBotSelector? botSelector = null,
        IBotBehaviorSelector? behaviorSelector = null,
        IRoomReplyLock? roomReplyLock = null)
        : base(context, publisher, aiClientFactory, logger)
    {
        _botSelector = botSelector;
        _behaviorSelector = behaviorSelector;
        _roomReplyLock = roomReplyLock;
    }

    /// <inheritdoc />
    protected override string TaskName => "GroupChatReplyTask";

    /// <inheritdoc />
    protected override BotType BotType => BotType.ChatBot;

    /// <inheritdoc />
    protected override async Task<BotType> DetermineBotTypeAsync(
        int organizationId,
        ChatMessage triggerMessage)
    {
        // 組織設定を取得
        var setting = await GetOrganizationSettingAsync(organizationId);
        if (setting == null ||
            setting.GenerativeApiVendor == GenerativeApiVendor.None ||
            string.IsNullOrEmpty(setting.GenerativeApiKey) ||
            string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            return BotType.ChatBot;
        }

        // AI クライアントを作成
        var aiClient = AiClientFactory.CreateClient(
            setting.GenerativeApiVendor,
            setting.GenerativeApiKey,
            setting.GenerativeApiModel
        );

        if (aiClient == null)
        {
            return BotType.ChatBot;
        }

        // BotSelector が利用不可の場合はデフォルトの BotType を返す
        if (_botSelector == null)
        {
            return BotType.ChatBot;
        }

        // メッセージの内容に基づいてBotタイプを決定
        return await _botSelector.DetermineBotTypeByContentAsync(
            aiClient,
            triggerMessage.Content ?? string.Empty
        );
    }

    /// <inheritdoc />
    protected override async Task<string> BuildReplyMessageAsync(
        int organizationId,
        ChatRoom room,
        ChatMessage triggerMessage,
        User senderUser,
        DB.Models.Bot bot)
    {
        // 組織設定を取得
        var setting = await GetOrganizationSettingAsync(organizationId);
        IAiClient? aiClient = null;

        if (setting != null &&
            setting.GenerativeApiVendor != GenerativeApiVendor.None &&
            !string.IsNullOrEmpty(setting.GenerativeApiKey) &&
            !string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            aiClient = AiClientFactory.CreateClient(
                setting.GenerativeApiVendor,
                setting.GenerativeApiKey,
                setting.GenerativeApiModel
            );
        }

        if (_behaviorSelector != null && setting != null)
        {
            var behaviorContext = new BotBehaviorContext
            {
                OrganizationId = organizationId,
                OrganizationSetting = setting,
                Room = room,
                TriggerMessage = triggerMessage,
                SenderUser = senderUser,
                Bot = bot,
                AiClient = aiClient,
                DbContext = Context,
                GetRecentMessagesAsync = GetRecentMessagesAsync,
            };

            var behavior = await _behaviorSelector.SelectBehaviorAsync(behaviorContext);

            if (behavior != null)
            {
                Logger.LogInformation(
                    "Executing behavior '{BehaviorName}': OrganizationId={OrganizationId}, RoomId={RoomId}",
                    behavior.Name,
                    organizationId,
                    room.Id
                );

                var result = await behavior.ExecuteAsync(behaviorContext);

                if (result != null)
                {
                    return result;
                }

                Logger.LogDebug(
                    "Behavior '{BehaviorName}' returned null, skipping message",
                    behavior.Name
                );
                return string.Empty;
            }
        }

        if (aiClient == null)
        {
            Logger.LogWarning(
                "AI settings not configured and no behavior selected: OrganizationId={OrganizationId}",
                organizationId
            );
            return "AI設定が構成されていないため、返信できません。";
        }

        return "...";
    }

    /// <summary>
    /// グループチャットへの返信を実行する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="triggerMessageId">トリガーとなったメッセージID</param>
    /// <param name="senderUserId">メッセージを送信したユーザーのID</param>
    public async Task SendReplyAsync(int organizationId, int roomId, int triggerMessageId, int senderUserId)
    {
        if (!BotTaskUtils.ShouldActivateBot(100))
        {
            return;
        }

        // ルーム単位の排他制御
        if (_roomReplyLock != null)
        {
            await using var lockHandle = await _roomReplyLock.TryAcquireAsync(roomId, LockTtl);

            if (lockHandle == null)
            {
                Logger.LogDebug(
                    "Skipping GroupChatReplyTask: RoomId={RoomId} is already being processed",
                    roomId
                );
                return;
            }

            await ExecuteReplyAsync(organizationId, roomId, triggerMessageId, senderUserId);
        }
        else
        {
            await ExecuteReplyAsync(organizationId, roomId, triggerMessageId, senderUserId);
        }
    }
}