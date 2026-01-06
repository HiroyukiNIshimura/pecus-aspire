using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Models;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Focus;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
using Pecus.Libs.Information;
using Pecus.Libs.Notifications;

namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// AI チャット返信用の Hangfire タスク
/// ユーザーからのメッセージに対して AI が返信を生成し送信する
/// </summary>
public class AiChatReplyTask
{
    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly SignalRNotificationPublisher _publisher;
    private readonly ILogger<AiChatReplyTask> _logger;
    private readonly IBotSelector? _botSelector;
    private readonly IMessageAnalyzer? _messageAnalyzer;
    private readonly IFocusTaskProvider? _focusTaskProvider;
    private readonly IInformationSearchProvider? _informationSearchProvider;

    /// <summary>
    /// Bot typing がタイムアウトするまでの時間（秒）
    /// フロントエンド側で自動リセットに使用
    /// </summary>
    public const int TypingTimeoutSeconds = 60;

    /// <summary>
    /// 会話履歴の最大ターン数
    /// </summary>
    private const int MaxConversationTurns = 5;

    /// <summary>
    /// 会話履歴の有効期間（日数）
    /// </summary>
    private const int ConversationHistoryDays = 2;

    /// <summary>
    /// 指示を求めているとみなす GuidanceSeekingScore の閾値
    /// </summary>
    private const int GuidanceSeekingThreshold = 50;

    /// <summary>
    /// 情報を求めているとみなす InformationSeekingScore の閾値
    /// </summary>
    private const int InformationSeekingThreshold = 50;

    /// <summary>
    /// AiChatReplyTask のコンストラクタ
    /// </summary>
    public AiChatReplyTask(
        ApplicationDbContext context,
        IAiClientFactory aiClientFactory,
        SignalRNotificationPublisher publisher,
        ILogger<AiChatReplyTask> logger,
        IBotSelector? botSelector = null,
        IMessageAnalyzer? messageAnalyzer = null,
        IFocusTaskProvider? focusTaskProvider = null,
        IInformationSearchProvider? informationSearchProvider = null)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
        _publisher = publisher;
        _logger = logger;
        _botSelector = botSelector;
        _messageAnalyzer = messageAnalyzer;
        _focusTaskProvider = focusTaskProvider;
        _informationSearchProvider = informationSearchProvider;
    }

    /// <summary>
    /// AI 返信を生成して送信する
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="triggerMessageId">トリガーとなったユーザーメッセージID</param>
    /// <param name="senderUserId">メッセージを送信したユーザーのID</param>
    public async Task SendReplyAsync(int organizationId, int roomId, int triggerMessageId, int senderUserId)
    {
        DB.Models.Bot? chatBot = null;

        try
        {
            // 組織設定を取得
            var setting = await GetOrganizationSettingAsync(organizationId);
            if (setting == null ||
                setting.GenerativeApiVendor == GenerativeApiVendor.None ||
                string.IsNullOrEmpty(setting.GenerativeApiKey) ||
                string.IsNullOrEmpty(setting.GenerativeApiModel))
            {
                _logger.LogWarning(
                    "GenerativeApiVendor is not configured or required fields are missing: OrganizationId={OrganizationId}, Setting={Setting}, Vendor={Vendor}",
                    organizationId,
                    setting != null ? "exists" : "null",
                    setting?.GenerativeApiVendor
                );
                return;
            }

            // AI クライアントを作成
            var aiClient = _aiClientFactory.CreateClient(
                setting.GenerativeApiVendor,
                setting.GenerativeApiKey,
                setting.GenerativeApiModel
            );

            if (aiClient == null)
            {
                _logger.LogWarning(
                    "Failed to create AI client: Vendor={Vendor}, OrganizationId={OrganizationId}, HasApiKey={HasApiKey}",
                    setting.GenerativeApiVendor,
                    organizationId,
                    !string.IsNullOrEmpty(setting.GenerativeApiKey)
                );
                return;
            }

            // トリガーメッセージを取得
            var triggerMessage = await _context.ChatMessages.FindAsync(triggerMessageId);
            var triggerContent = triggerMessage?.Content ?? string.Empty;

            // ランダムにボット選択方法を決定（会話履歴分析 or ランダム選択）
            var useRandomSelection = Random.Shared.Next(2) == 0;

            if (useRandomSelection && _botSelector != null)
            {
                _logger.LogDebug("Using random bot selection for RoomId={RoomId}", roomId);
                chatBot = await _botSelector.GetRandomBotAsync(organizationId);
            }
            else
            {
                // 会話履歴を取得して宛先ボットを判定
                var conversationHistory = await BuildConversationHistoryForTargetAnalysisAsync(roomId, organizationId);
                chatBot = await SelectBotByConversationAsync(organizationId, aiClient, conversationHistory, triggerContent);
            }

            // 宛先判定できなかった場合は従来のBotType判定にフォールバック
            if (chatBot?.ChatActor == null)
            {
                var botType = await DetermineBotTypeAsync(organizationId, aiClient, triggerContent);
                chatBot = await GetBotByTypeAsync(organizationId, botType);
            }

            if (chatBot?.ChatActor == null)
            {
                _logger.LogWarning(
                    "ChatBot not found for OrganizationId={OrganizationId}. ChatBot={ChatBot}, ChatActor={ChatActor}",
                    organizationId,
                    chatBot != null ? "exists" : "null",
                    chatBot?.ChatActor != null ? "exists" : "null"
                );
                return;
            }

            // Bot の既読通知を送信（Bot がメッセージを「読んだ」タイミング）
            var readAt = DateTimeOffset.UtcNow;
            await _publisher.PublishChatBotReadAsync(
                organizationId,
                roomId,
                chatBot.ChatActor.Id,
                readAt,
                triggerMessageId
            );

            // Bot の LastReadAt を更新
            await UpdateBotLastReadAtAsync(roomId, chatBot.ChatActor.Id, readAt);

            // 入力開始を通知
            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                roomId,
                chatBot.ChatActor.Id,
                chatBot.Name,
                isTyping: true
            );

            // 送信者のユーザー名を取得
            var senderUserName = await GetUserNameAsync(senderUserId);
            if (string.IsNullOrEmpty(senderUserName))
            {
                _logger.LogWarning(
                    "User not found for SenderUserId={SenderUserId}, skipping AI reply",
                    senderUserId
                );
                return;
            }

            // 指示を求めているかどうかを判定し、適切なメッセージとロールを構築
            var (messages, role) = await BuildMessagesWithContextAsync(
                aiClient,
                triggerContent,
                senderUserId,
                senderUserName,
                roomId,
                chatBot.ChatActor.Id
            );

            // Bot のペルソナと行動指針からシステムプロンプトを作成（ランダムな役割を付与）
            var systemPrompt = new SystemPromptBuilder()
                .WithRawPersona(chatBot.Persona)
                .WithRole(role)
                .WithRawConstraint(chatBot.Constraint)
                .Build();

            // AI API を呼び出して返信を生成
            var responseText = await aiClient.GenerateTextWithMessagesAsync(
                messages,
                systemPrompt
            );

            // 入力終了を通知
            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                roomId,
                chatBot.ChatActor.Id,
                chatBot.Name,
                isTyping: false
            );

            // メッセージを保存して通知
            await SendBotMessageAsync(organizationId, roomId, chatBot, responseText ?? "...");

            _logger.LogInformation(
                "AiChatReplyTask completed: OrganizationId={OrganizationId}, RoomId={RoomId}",
                organizationId,
                roomId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "AiChatReplyTask failed: OrganizationId={OrganizationId}, RoomId={RoomId}, TriggerMessageId={TriggerMessageId}",
                organizationId,
                roomId,
                triggerMessageId
            );

            // エラー時も入力終了を通知
            if (chatBot?.ChatActor != null)
            {
                try
                {
                    await _publisher.PublishChatBotTypingAsync(
                        organizationId,
                        roomId,
                        chatBot.ChatActor.Id,
                        chatBot.Name,
                        isTyping: false
                    );

                    // エラー通知を送信
                    await _publisher.PublishChatBotErrorAsync(
                        organizationId,
                        roomId,
                        chatBot.ChatActor.Id,
                        chatBot.Name,
                        "申し訳ありません、応答を生成できませんでした。しばらくしてからもう一度お試しください。"
                    );
                }
                catch (Exception notifyEx)
                {
                    _logger.LogError(
                        notifyEx,
                        "Failed to send error notification: RoomId={RoomId}",
                        roomId
                    );
                }
            }

            throw;
        }
    }

    /// <summary>
    /// メッセージの内容に基づいて BotType を決定する
    /// </summary>
    private async Task<BotType> DetermineBotTypeAsync(
        int organizationId,
        IAiClient aiClient,
        string triggerContent)
    {
        if (_botSelector == null)
        {
            return BotType.ChatBot;
        }

        return await _botSelector.DetermineBotTypeByContentAsync(
            aiClient,
            triggerContent
        );
    }

    /// <summary>
    /// 会話履歴に基づいて宛先ボットを選択する
    /// </summary>
    private async Task<DB.Models.Bot?> SelectBotByConversationAsync(
        int organizationId,
        IAiClient aiClient,
        IReadOnlyList<ConversationMessage> conversationHistory,
        string lastUserMessage)
    {
        if (_botSelector == null || conversationHistory.Count == 0)
        {
            return null;
        }

        return await _botSelector.SelectBotByConversationAsync(
            organizationId,
            aiClient,
            conversationHistory,
            lastUserMessage
        );
    }

    /// <summary>
    /// 宛先判定用の会話履歴を構築する
    /// </summary>
    private async Task<List<ConversationMessage>> BuildConversationHistoryForTargetAnalysisAsync(
        int roomId,
        int organizationId)
    {
        var twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-ConversationHistoryDays);

        var recentMessages = await _context.ChatMessages
            .Where(m => m.ChatRoomId == roomId && m.CreatedAt >= twoDaysAgo)
            .OrderByDescending(m => m.CreatedAt)
            .Take(MaxConversationTurns * 2)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new
            {
                m.SenderActorId,
                m.Content,
            })
            .ToListAsync();

        var actorIds = recentMessages.Select(m => m.SenderActorId).Distinct().ToList();

        var actors = await _context.ChatActors
            .Where(a => actorIds.Contains(a.Id))
            .Select(a => new
            {
                a.Id,
                a.ActorType,
            })
            .ToListAsync();

        var bots = await _context.Bots
            .Include(b => b.ChatActor)
            .Where(b => b.OrganizationId == organizationId && b.ChatActor != null)
            .Select(b => new
            {
                ChatActorId = b.ChatActor!.Id,
                b.Name,
            })
            .ToListAsync();

        var users = await _context.Users
            .Include(u => u.ChatActor)
            .Where(u => u.OrganizationId == organizationId && u.ChatActor != null)
            .Select(u => new
            {
                ChatActorId = u.ChatActor!.Id,
                u.Username,
            })
            .ToListAsync();

        var conversationHistory = new List<ConversationMessage>();

        foreach (var msg in recentMessages)
        {
            var actor = actors.FirstOrDefault(a => a.Id == msg.SenderActorId);
            var isBot = actor?.ActorType == ChatActorType.Bot;

            string senderName;
            if (isBot)
            {
                var bot = bots.FirstOrDefault(b => b.ChatActorId == msg.SenderActorId);
                senderName = bot?.Name ?? "Unknown Bot";
            }
            else
            {
                var user = users.FirstOrDefault(u => u.ChatActorId == msg.SenderActorId);
                senderName = user?.Username ?? "Unknown User";
            }

            conversationHistory.Add(new ConversationMessage
            {
                SenderId = msg.SenderActorId.ToString()!,
                SenderName = senderName,
                IsBot = isBot,
                Content = msg.Content,
            });
        }

        return conversationHistory;
    }

    /// <summary>
    /// 指定された BotType の Bot を取得する
    /// </summary>
    private async Task<DB.Models.Bot?> GetBotByTypeAsync(int organizationId, BotType botType)
    {
        return await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == botType);
    }

    /// <summary>
    /// 組織設定を取得する
    /// </summary>
    private async Task<OrganizationSetting?> GetOrganizationSettingAsync(int organizationId)
    {
        return await _context.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);
    }

    /// <summary>
    /// ユーザーの表示名を取得する
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>ユーザーの表示名（見つからない場合は null）</returns>
    private async Task<string?> GetUserNameAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.Username;
    }

    /// <summary>
    /// 会話履歴からメッセージ配列を構築する
    /// 過去のメッセージを取得し、発言者を明示して AI が混乱しないようにする
    /// </summary>
    private async Task<List<(MessageRole Role, string Content)>> BuildConversationMessagesAsync(
        int roomId,
        int botActorId)
    {
        var twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-ConversationHistoryDays);

        // 過去のメッセージを取得（最大 MaxConversationTurns * 2 = 10 メッセージ）
        var recentMessages = await _context.ChatMessages
            .Include(m => m.SenderActor)
            .Where(m => m.ChatRoomId == roomId && m.CreatedAt >= twoDaysAgo)
            .OrderByDescending(m => m.CreatedAt)
            .Take(MaxConversationTurns * 2)
            .OrderBy(m => m.CreatedAt)  // 時系列順に戻す
            .Select(m => new
            {
                m.SenderActorId,
                m.Content,
                m.SenderActor!.ActorType,
            })
            .ToListAsync();

        // 他の Bot の ActorId と名前を取得
        var otherBotActorIds = recentMessages
            .Where(m => m.ActorType == ChatActorType.Bot && m.SenderActorId != botActorId)
            .Select(m => m.SenderActorId)
            .Distinct()
            .ToList();

        var otherBotNames = new Dictionary<int, string>();
        if (otherBotActorIds.Count > 0)
        {
            otherBotNames = await _context.Bots
                .Include(b => b.ChatActor)
                .Where(b => b.ChatActor != null && otherBotActorIds.Contains(b.ChatActor.Id))
                .ToDictionaryAsync(b => b.ChatActor!.Id, b => b.Name);
        }

        var messages = new List<(MessageRole Role, string Content)>();

        foreach (var msg in recentMessages)
        {
            if (msg.SenderActorId == botActorId)
            {
                // 自分（現在の Bot）のメッセージは Assistant
                messages.Add((MessageRole.Assistant, msg.Content));
            }
            else if (msg.ActorType == ChatActorType.Bot && msg.SenderActorId.HasValue)
            {
                // 他の Bot のメッセージは User として、発言者名を付与して区別
                var botName = otherBotNames.TryGetValue(msg.SenderActorId.Value, out var name) ? name : "他のBot";
                messages.Add((MessageRole.User, $"[{botName}]: {msg.Content}"));
            }
            else
            {
                // 人間ユーザーのメッセージは User
                messages.Add((MessageRole.User, msg.Content));
            }
        }

        return messages;
    }

    /// <summary>
    /// Bot メッセージを保存して SignalR 通知を送信する
    /// </summary>
    private async Task SendBotMessageAsync(
        int organizationId,
        int roomId,
        DB.Models.Bot chatBot,
        string content)
    {
        // ルームを取得
        var room = await _context.ChatRooms.FindAsync(roomId);
        if (room == null)
        {
            _logger.LogWarning("ChatRoom not found: RoomId={RoomId}", roomId);
            return;
        }

        // メッセージを作成
        var message = new DB.Models.ChatMessage
        {
            ChatRoomId = roomId,
            SenderActorId = chatBot.ChatActor!.Id,
            MessageType = ChatMessageType.Text,
            Content = content,
        };
        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        // ルームの UpdatedAt を更新（後勝ち、RowVersion 競合回避）
        await _context.ChatRooms
            .Where(r => r.Id == room.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));

        // SignalR 通知を送信（Redis Pub/Sub 経由）
        var payload = new
        {
            RoomId = roomId,
            RoomType = room.Type.ToString(),
            Message = new
            {
                message.Id,
                SenderActorId = chatBot.ChatActor.Id,
                message.MessageType,
                message.Content,
                message.ReplyToMessageId,
                message.CreatedAt,
                Sender = new
                {
                    Id = chatBot.ChatActor.Id,
                    ActorType = chatBot.ChatActor.ActorType.ToString(),
                    UserId = (int?)null,
                    BotId = chatBot.Id,
                    DisplayName = chatBot.Name,
                    AvatarType = chatBot.ChatActor.AvatarType?.ToString()?.ToLowerInvariant(),
                    AvatarUrl = chatBot.IconUrl,
                    IdentityIconUrl = chatBot.IconUrl ?? "",
                    IsActive = true,
                },
            },
        };

        // チャットルームグループに通知
        await _publisher.PublishChatBotNotificationAsync(
            organizationId,
            roomId,
            "chat:message_received",
            payload
        );

        // organization グループに未読バッジ更新を通知
        await _publisher.PublishAsync(new SignalRNotification
        {
            GroupName = $"organization:{organizationId}",
            EventType = "chat:unread_updated",
            Payload = new
            {
                RoomId = roomId,
                RoomType = room.Type.ToString(),
                SenderActorId = chatBot.ChatActor.Id,
            },
            SourceType = NotificationSourceType.ChatBot,
            OrganizationId = organizationId,
        });
    }

    /// <summary>
    /// Bot の LastReadAt を更新する
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="botActorId">Bot のアクターID</param>
    /// <param name="readAt">既読日時</param>
    private async Task UpdateBotLastReadAtAsync(int roomId, int botActorId, DateTimeOffset readAt)
    {
        var member = await _context.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == roomId && m.ChatActorId == botActorId);

        if (member != null)
        {
            member.LastReadAt = readAt;
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// コンテキストに応じたメッセージ配列とロールを構築する
    /// 指示を求めている場合はタスク情報を含め、情報を求めている場合は関連情報を含め、
    /// そうでない場合は会話履歴を使用
    /// </summary>
    private async Task<(List<(MessageRole Role, string Content)> Messages, RoleConfig Role)> BuildMessagesWithContextAsync(
        IAiClient aiClient,
        string triggerContent,
        int userId,
        string senderUserName,
        int roomId,
        int botActorId)
    {
        var userNamePrompt = $"Userを示す二人称は、{senderUserName}さんです。";

        // メッセージを分析して適切なコンテキストを取得
        var (context, role) = await TryGetContextAsync(aiClient, triggerContent, userId);

        if (context != null)
        {
            // コンテキストモード: 取得した情報をコンテキストに含めたシンプルな構成
            var messages = new List<(MessageRole Role, string Content)>
            {
                (MessageRole.System, userNamePrompt),
                (MessageRole.System, context),
                (MessageRole.User, triggerContent)
            };
            return (messages, role);
        }

        // 通常モード: 会話履歴を使用
        var conversationMessages = await BuildConversationMessagesAsync(roomId, botActorId);
        conversationMessages.Insert(0, (MessageRole.System, userNamePrompt));
        return (conversationMessages, RoleRandomizer.GetRandomRole());
    }

    /// <summary>
    /// メッセージを分析し、適切なコンテキストとロールを取得する
    /// </summary>
    private async Task<(string? Context, RoleConfig Role)> TryGetContextAsync(
        IAiClient aiClient,
        string triggerContent,
        int userId)
    {
        if (_messageAnalyzer == null)
        {
            return (null, RoleRandomizer.GetRandomRole());
        }

        try
        {
            var sentimentResult = await _messageAnalyzer.AnalyzeAsync(aiClient, triggerContent);

            // 情報を求めている場合（InformationSeekingScore が高い）
            if (sentimentResult.InformationSeekingScore >= InformationSeekingThreshold)
            {
                _logger.LogDebug(
                    "Message is seeking information: InformationSeekingScore={Score}, Topic={Topic}",
                    sentimentResult.InformationSeekingScore,
                    sentimentResult.InformationTopic
                );

                var informationContext = await TryGetInformationContextAsync(
                    userId,
                    sentimentResult.InformationTopic
                );

                if (informationContext != null)
                {
                    return (informationContext, RoleRandomizer.SecretaryRole);
                }
            }

            // 指示を求めている場合（GuidanceSeekingScore が高い）
            if (sentimentResult.GuidanceSeekingScore >= GuidanceSeekingThreshold)
            {
                _logger.LogDebug(
                    "Message is seeking guidance: GuidanceSeekingScore={Score}",
                    sentimentResult.GuidanceSeekingScore
                );

                var taskContext = await TryGetTaskContextAsync(userId);

                if (taskContext != null)
                {
                    return (taskContext, RoleRandomizer.SecretaryRole);
                }
            }

            _logger.LogDebug(
                "Message not seeking guidance or information: GuidanceSeekingScore={GuidanceScore}, InformationSeekingScore={InfoScore}",
                sentimentResult.GuidanceSeekingScore,
                sentimentResult.InformationSeekingScore
            );

            return (null, RoleRandomizer.GetRandomRole());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get context");
            return (null, RoleRandomizer.GetRandomRole());
        }
    }

    /// <summary>
    /// 情報探索用のコンテキストを取得する
    /// </summary>
    private async Task<string?> TryGetInformationContextAsync(int userId, string? informationTopic)
    {
        if (string.IsNullOrWhiteSpace(informationTopic) || _informationSearchProvider == null)
        {
            return null;
        }

        try
        {
            var searchResult = await _informationSearchProvider.SearchAsync(
                userId,
                informationTopic,
                limit: 5
            );

            if (searchResult.Items.Count == 0)
            {
                _logger.LogDebug(
                    "No information found for topic: Topic={Topic}",
                    informationTopic
                );
                return null;
            }

            return BuildInformationContextPrompt(searchResult);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to search information: Topic={Topic}", informationTopic);
            return null;
        }
    }

    /// <summary>
    /// タスクコンテキストを取得する
    /// </summary>
    private async Task<string?> TryGetTaskContextAsync(int userId)
    {
        if (_focusTaskProvider == null)
        {
            return null;
        }

        var taskResult = await _focusTaskProvider.GetFocusTasksAsync(
            userId,
            focusTasksLimit: 5,
            waitingTasksLimit: 3
        );

        return BuildTaskContextPrompt(taskResult);
    }

    /// <summary>
    /// 情報検索結果からコンテキストプロンプトを生成する
    /// </summary>
    private static string BuildInformationContextPrompt(Information.Models.InformationSearchResult searchResult)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"【参考情報】「{searchResult.SearchTopic}」に関連するドキュメント:");
        sb.AppendLine();

        foreach (var item in searchResult.Items)
        {
            sb.AppendLine($"■ [{item.WorkspaceCode}#{item.ItemCode}] {item.Subject}");
            if (!string.IsNullOrWhiteSpace(item.BodySnippet))
            {
                var snippet = item.BodySnippet.Length > 150
                    ? item.BodySnippet[..150] + "..."
                    : item.BodySnippet;
                sb.AppendLine($"  概要: {snippet}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("この情報を参考に、ユーザーの質問に答えてください。");
        sb.AppendLine("ただし、情報をそのまま列挙するのではなく、自然な会話として回答してください。");
        sb.AppendLine("参照元のドキュメントコード（[ワークスペースコード#アイテムコード]形式）を適宜含めてください。");

        return sb.ToString();
    }

    /// <summary>
    /// タスク情報からコンテキストプロンプトを生成する
    /// </summary>
    private static string BuildTaskContextPrompt(Focus.Models.FocusTaskResult taskResult)
    {
        if (taskResult.TotalTaskCount == 0)
        {
            return "【参考情報】このユーザーには現在割り当てられているタスクがありません。";
        }

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("【参考情報】ユーザーのやることリスト（優先度順）:");

        if (taskResult.FocusTasks.Count > 0)
        {
            sb.AppendLine("■ 今すぐ着手可能なタスク:");
            foreach (var task in taskResult.FocusTasks)
            {
                var priorityText = task.Priority?.ToString() ?? "未設定";
                var dueText = FormatDueDate(task.DueDate);
                sb.AppendLine($"  - コード:[{task.WorkspaceCode}#{task.ItemCode}T{task.Sequence}] {task.Content} (優先度: {priorityText}, 期限: {dueText}, スコア: {task.TotalScore:F0})");
                if (!string.IsNullOrEmpty(task.ItemSubject))
                {
                    sb.AppendLine($"    関連アイテム: {task.ItemSubject}");
                }
            }
        }

        if (taskResult.WaitingTasks.Count > 0)
        {
            sb.AppendLine("■ 待機中のタスク（先行タスク完了待ち）:");
            foreach (var task in taskResult.WaitingTasks)
            {
                sb.AppendLine($"  - コード:[{task.WorkspaceCode}#{task.ItemCode}T{task.Sequence}] {task.Content} (待機中: {task.PredecessorItemCode} の完了待ち)");
            }
        }

        sb.AppendLine();
        sb.AppendLine("この情報を参考に、ユーザーが次に何をすべきか具体的にアドバイスしてください。");
        sb.AppendLine("ただし、タスク一覧をそのまま列挙するのではなく、自然な会話として提案してください。");
        sb.AppendLine("タスク名には[コード]を含めてください。");

        return sb.ToString();
    }

    /// <summary>
    /// 期限日時を人間が読みやすい形式にフォーマットする
    /// </summary>
    private static string FormatDueDate(DateTimeOffset dueDate)
    {
        var now = DateTimeOffset.UtcNow;
        var diff = dueDate - now;

        if (diff.TotalHours < 0)
        {
            return "期限切れ";
        }
        if (diff.TotalHours <= 24)
        {
            return "今日中";
        }
        if (diff.TotalHours <= 48)
        {
            return "明日";
        }
        if (diff.TotalDays <= 7)
        {
            return $"{diff.TotalDays:F0}日後";
        }

        return dueDate.ToString("M/d");
    }
}