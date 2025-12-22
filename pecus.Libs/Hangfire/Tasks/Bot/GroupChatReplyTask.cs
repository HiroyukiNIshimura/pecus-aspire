using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// グループチャット投稿時に Bot が返信を生成する Hangfire タスク
/// ユーザーからのメッセージに対してワークスペースグループチャットに返信を送信する
/// </summary>
public class GroupChatReplyTask : GroupChatReplyTaskBase
{
    /// <summary>
    /// 会話履歴の最大ターン数
    /// </summary>
    private const int MaxConversationTurns = 5;

    /// <summary>
    /// GroupChatReplyTask のコンストラクタ
    /// </summary>
    public GroupChatReplyTask(
        ApplicationDbContext context,
        SignalRNotificationPublisher publisher,
        IAiClientFactory aiClientFactory,
        ILogger<GroupChatReplyTask> logger)
        : base(context, publisher, aiClientFactory, logger)
    {
    }

    /// <inheritdoc />
    protected override string TaskName => "GroupChatReplyTask";

    /// <inheritdoc />
    protected override BotType BotType => BotType.ChatBot;

    /// <inheritdoc />
    protected override async Task<(string Message, BotType BotType)> BuildReplyMessage(
        int organizationId,
        ChatRoom room,
        ChatMessage triggerMessage,
        User senderUser)
    {
        // 組織設定を取得
        var setting = await GetOrganizationSettingAsync(organizationId);
        if (setting == null ||
            setting.GenerativeApiVendor == GenerativeApiVendor.None ||
            string.IsNullOrEmpty(setting.GenerativeApiKey) ||
            string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            Logger.LogWarning(
                "AI settings not configured for organization: OrganizationId={OrganizationId}",
                organizationId
            );
            return ("AI設定が構成されていないため、返信できません。", BotType.ChatBot);
        }

        // AI クライアントを作成
        var aiClient = AiClientFactory.CreateClient(
            setting.GenerativeApiVendor,
            setting.GenerativeApiKey,
            setting.GenerativeApiModel
        );

        if (aiClient == null)
        {
            Logger.LogWarning(
                "Failed to create AI client: Vendor={Vendor}, OrganizationId={OrganizationId}",
                setting.GenerativeApiVendor,
                organizationId
            );
            return ("AIクライアントの作成に失敗しました。", BotType.ChatBot);
        }

        // メッセージが注意を必要とするか判定（困っている or ネガティブ or 緊急）
        var needsAttention = await MessageAnalyzer.NeedsAttentionAsync(
            aiClient,
            triggerMessage.Content ?? string.Empty,
            Logger
        );

        // 注意が必要な場合は SystemBot、それ以外は ChatBot を使用
        var selectedBotType = needsAttention ? BotType.SystemBot : BotType.ChatBot;

        Logger.LogDebug(
            "Bot type selected: NeedsAttention={NeedsAttention}, BotType={BotType}, RoomId={RoomId}",
            needsAttention,
            selectedBotType,
            room.Id
        );

        // 過去メッセージを取得
        var recent = await GetRecentMessagesAsync(room.Id, MaxConversationTurns, triggerMessage.Id);

        // メッセージを AI ロール形式に変換
        var messages = new List<(MessageRole Role, string Content)>();

        // 過去メッセージをロール形式に変換（Bot は assistant、その他は user）
        foreach (var msg in recent)
        {
            var role = msg.IsBot ? MessageRole.Assistant : MessageRole.User;
            var content = msg.IsBot ? msg.Content : $"{msg.UserName}さん: {msg.Content}";
            messages.Add((role, content ?? string.Empty));
        }

        // トリガーメッセージを追加
        messages.Add((MessageRole.User, $"{senderUser.Username}さん: {triggerMessage.Content}"));

        // 選択された BotType で Bot を取得してペルソナを取得
        var bot = await GetBotByTypeAsync(organizationId, selectedBotType);
        var persona = bot?.Persona;

        // AI API を呼び出して返信を生成
        try
        {
            var responseText = await aiClient.GenerateTextWithMessagesAsync(
                messages,
                persona
            );

            return (responseText ?? "...", selectedBotType);
        }
        catch (Exception ex)
        {
            Logger.LogError(
                ex,
                "AI generation failed: OrganizationId={OrganizationId}, RoomId={RoomId}",
                organizationId,
                room.Id
            );
            return ("申し訳ありませんが、一時的なエラーが発生しました。", selectedBotType);
        }
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
        if (!BotTaskUtils.ShouldActivateBot(130))
        {
            return;
        }

        await ExecuteReplyAsync(organizationId, roomId, triggerMessageId, senderUserId);
    }
}