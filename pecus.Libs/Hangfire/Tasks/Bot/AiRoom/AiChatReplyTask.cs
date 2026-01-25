using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Models;
using Pecus.Libs.AI.Tools;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot.Guards;
using Pecus.Libs.Hangfire.Tasks.Bot.Utils;
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
    private readonly IAiToolExecutor? _toolExecutor;
    private readonly IBotTaskGuard _taskGuard;
    private readonly IInputQualityAnalyzer _inputQualityAnalyzer;

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
    /// ツール実行に必要な最低関連度スコア
    /// </summary>
    private const int MinToolRelevanceScore = 50;

    /// <summary>
    /// WildBot くじ引きの最小閾値（%）
    /// </summary>
    private const int WildBotMinThreshold = 2;

    /// <summary>
    /// WildBot くじ引きの追加ランダム範囲
    /// </summary>
    private const int WildBotThresholdRange = 49;

    /// <summary>
    /// AiChatReplyTask のコンストラクタ
    /// </summary>
    public AiChatReplyTask(
        ApplicationDbContext context,
        IAiClientFactory aiClientFactory,
        SignalRNotificationPublisher publisher,
        ILogger<AiChatReplyTask> logger,
        IBotTaskGuard taskGuard,
        IInputQualityAnalyzer inputQualityAnalyzer,
        IBotSelector? botSelector = null,
        IMessageAnalyzer? messageAnalyzer = null,
        IAiToolExecutor? toolExecutor = null
        )
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
        _publisher = publisher;
        _logger = logger;
        _botSelector = botSelector;
        _messageAnalyzer = messageAnalyzer;
        _toolExecutor = toolExecutor;
        _inputQualityAnalyzer = inputQualityAnalyzer;
        _taskGuard = taskGuard;
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
        DB.Models.Bot? chatBot = await GetBotByTypeAsync(organizationId, BotType.ChatBot);

        try
        {
            var (isBotEnabled, signature) = await _taskGuard.IsBotEnabledAsync(organizationId);
            if (!isBotEnabled || signature == null)
            {
                _logger.LogInformation(
                    "Bot is disabled for OrganizationId={OrganizationId}, skipping AI reply",
                    organizationId
                );
                return;
            }

            // AI クライアントを作成
            var aiClient = _aiClientFactory.CreateClient(
                signature.GenerativeApiVendor,
                signature.GenerativeApiKey,
                signature.GenerativeApiModel
            );

            if (aiClient == null)
            {
                _logger.LogWarning(
                    "Failed to create AI client: Vendor={Vendor}, OrganizationId={OrganizationId}, HasApiKey={HasApiKey}",
                    signature.GenerativeApiVendor,
                    organizationId,
                    !string.IsNullOrEmpty(signature.GenerativeApiKey)
                );
                return;
            }

            // トリガーメッセージを取得
            var triggerMessage = await _context.ChatMessages.FindAsync(triggerMessageId);
            var triggerContent = triggerMessage?.Content ?? string.Empty;

            var useWildBot = false;
            // 2%〜50%のランダムな確率で入力品質を判定
            if (!string.IsNullOrWhiteSpace(triggerContent) && TryWildBotLottery(out var threshold))
            {
                // 入力内容に基づき入力品質を判定
                var inputQualityResult = await _inputQualityAnalyzer.AnalyzeAsync(aiClient, triggerContent);
                if (inputQualityResult.IsGibberish || inputQualityResult.Type == InputQualityType.ContainsSpecialKeyword)
                {
                    //WildBotをで応答させる
                    useWildBot = true;
                    chatBot = await GetBotByTypeAsync(organizationId, BotType.WildBot);

                    _logger.LogInformation(
                        "Input quality check triggered WildBot response: IsGibberish={IsGibberish}, Type={Type}, OrganizationId={OrganizationId}, RoomId={RoomId}, threshold={Threshold}%, TriggerMessageId={TriggerMessageId}",
                        inputQualityResult.IsGibberish,
                        inputQualityResult.Type,
                        organizationId,
                        roomId,
                        threshold,
                        triggerMessageId
                    );
                }
            }

            //ハズレの場合は通常処理へ
            if (!useWildBot)
            {
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
            }

            // 宛先判定できなかった場合は従来のBotType判定にフォールバック
            if (chatBot?.ChatActors.Any() != true)
            {
                var botType = await DetermineBotTypeAsync(aiClient, triggerContent);
                chatBot = await GetBotByTypeAsync(organizationId, botType);
            }

            if (chatBot?.ChatActors.Any() != true)
            {
                _logger.LogWarning(
                    "ChatBot not found for OrganizationId={OrganizationId}. ChatBot={ChatBot}, ChatActor={ChatActor}",
                    organizationId,
                    chatBot != null ? "exists" : "null",
                    chatBot?.ChatActors.Any() == true ? "exists" : "null"
                );
                return;
            }

            // Bot の既読通知を送信（Bot がメッセージを「読んだ」タイミング）
            var readAt = DateTimeOffset.UtcNow;
            await _publisher.PublishChatBotReadAsync(
                organizationId,
                roomId,
                chatBot.GetChatActorId(),
                readAt,
                triggerMessageId
            );

            // Bot の LastReadAt を更新
            await UpdateBotLastReadAtAsync(roomId, chatBot.GetChatActorId(), readAt);

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

            // 入力開始を通知
            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                roomId,
                chatBot.GetChatActorId(),
                chatBot.Name,
                isTyping: true
            );

            var responseText = string.Empty;
            List<(MessageRole Role, string Content)>? requestMessages = null;
            RoleConfig? requestRole = null;

            if (!useWildBot)
            {
                // 指示を求めているかどうかを判定し、適切なメッセージとロールを構築
                var (messages, role) = await BuildMessagesWithContextAsync(
                    aiClient,
                    triggerContent,
                    senderUserId,
                    senderUserName,
                    roomId,
                    chatBot.GetChatActorId()
                );
                requestMessages = messages;
                requestRole = role;
            }
            else
            {
                // WildBot 用のロールなど付与しないメッセージ構築
                requestMessages = new List<(MessageRole Role, string Content)>
                {
                    (MessageRole.User, triggerContent)
                };
            }

            if (chatBot.Type != BotType.WildBot && requestRole == null && TryWildBotLottery(out _))
            {
                //BuildMessagesWithContextAsyncで役割が付与されなかった場合
                //もう一度Wild Botのくじ引き
                chatBot = await GetBotByTypeAsync(organizationId, BotType.WildBot);
                _logger.LogInformation(
                    "Second WildBot selection succeeded: OrganizationId={OrganizationId}, RoomId={RoomId}, TriggerMessageId={TriggerMessageId}",
                    organizationId,
                    roomId,
                    triggerMessageId
                );
            }

            // Bot のペルソナと行動指針からシステムプロンプトを作成（ランダムな役割を付与）
            var systemPrompt = new SystemPromptBuilder()
                .WithRawPersona(chatBot.Persona)
                .WithRole(requestRole)
                .WithRawConstraint(chatBot.Constraint)
                .Build();

            // AI API を呼び出して返信を生成
            responseText = await aiClient.GenerateTextWithMessagesAsync(
                requestMessages,
                systemPrompt
            );

            // 入力終了を通知
            await _publisher.PublishChatBotTypingAsync(
                organizationId,
                roomId,
                chatBot.GetChatActorId(),
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
            if (chatBot?.ChatActors.Any() == true)
            {
                try
                {
                    await _publisher.PublishChatBotTypingAsync(
                        organizationId,
                        roomId,
                        chatBot.GetChatActorId(),
                        chatBot.Name,
                        isTyping: false
                    );

                    // エラー通知を送信
                    await _publisher.PublishChatBotErrorAsync(
                        organizationId,
                        roomId,
                        chatBot.GetChatActorId(),
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
    /// WildBot くじ引きを実行する（2%〜50%の確率で当選）
    /// </summary>
    /// <param name="threshold">実際に使用された閾値（%）</param>
    /// <returns>当選した場合は true</returns>
    private static bool TryWildBotLottery(out int threshold)
    {
        var roll = Random.Shared.Next(100);
        threshold = WildBotMinThreshold + Random.Shared.Next(WildBotThresholdRange);
        return roll < threshold;
    }

    /// <summary>
    /// メッセージの内容に基づいて BotType を決定する
    /// </summary>
    private async Task<BotType> DetermineBotTypeAsync(
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
            .Include(b => b.ChatActors.Where(ca => ca.OrganizationId == organizationId))
            .Where(b => b.ChatActors.Any())
            .SelectMany(b => b.ChatActors.Select(ca => new
            {
                ChatActorId = ca.Id,
                b.Name,
            }))
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
    private async Task<DB.Models.Bot> GetBotByTypeAsync(int organizationId, BotType botType)
    {
        var bot = await _context.Bots
            .Include(b => b.ChatActors.Where(ca => ca.OrganizationId == organizationId))
            .FirstOrDefaultAsync(b => b.Type == botType);

        if (bot == null)
        {
            throw new InvalidOperationException($"Bot of type {botType} not found for OrganizationId={organizationId}");
        }
        return bot;
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
            otherBotNames = await _context.ChatActors
                .Include(ca => ca.Bot)
                .Where(ca => ca.BotId != null && otherBotActorIds.Contains(ca.Id))
                .ToDictionaryAsync(ca => ca.Id, ca => ca.Bot!.Name);
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
            SenderActorId = chatBot.GetChatActorId(),
            MessageType = ChatMessageType.Text,
            Content = content,
        };
        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        // ルームの UpdatedAt を更新（後勝ち、RowVersion 競合回避）
        await _context.ChatRooms
            .Where(r => r.Id == room.Id)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));

        var chatActor = chatBot.GetChatActor()!;

        // SignalR 通知を送信（Redis Pub/Sub 経由）
        var payload = new
        {
            RoomId = roomId,
            RoomType = room.Type.ToString(),
            Message = new
            {
                message.Id,
                SenderActorId = chatActor.Id,
                message.MessageType,
                message.Content,
                message.ReplyToMessageId,
                message.CreatedAt,
                Sender = new
                {
                    chatActor.Id,
                    ActorType = chatActor.ActorType.ToString(),
                    UserId = (int?)null,
                    BotId = chatBot.Id,
                    DisplayName = chatActor.DisplayName,
                    AvatarType = chatActor.AvatarType?.ToString()?.ToLowerInvariant(),
                    AvatarUrl = chatActor.AvatarUrl ?? chatBot.IconUrl,
                    IdentityIconUrl = chatActor.AvatarUrl ?? chatBot.IconUrl ?? "",
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
                SenderActorId = chatActor.Id,
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
    private async Task<(List<(MessageRole Role, string Content)> Messages, RoleConfig? Role)> BuildMessagesWithContextAsync(
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
        if (role == null)
        {
            // コンテキストモード: 取得した情報をコンテキストに含めたシンプルな構成
            var messages = new List<(MessageRole Role, string Content)>
            {
                (MessageRole.User, triggerContent)
            };
            return (messages, null);
        }

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
    /// IAiToolExecutor を使用してツールベースでコンテキストを生成
    /// </summary>
    private async Task<(string? Context, RoleConfig? Role)> TryGetContextAsync(
        IAiClient aiClient,
        string triggerContent,
        int userId)
    {
        if (_messageAnalyzer == null || _toolExecutor == null)
        {
            return (null, RoleRandomizer.GetRandomRole());
        }

        try
        {
            var sentimentResult = await _messageAnalyzer.AnalyzeAsync(aiClient, triggerContent);
            if (sentimentResult.IsNeutral)
            {
                _logger.LogDebug("Message sentiment is neutral, skipping context generation");
                return (null, null);
            }

            _logger.LogDebug(
                "Message analyzed: GuidanceSeekingScore={GuidanceScore}, InformationSeekingScore={InfoScore}, Topic={Topic}",
                sentimentResult.GuidanceSeekingScore,
                sentimentResult.InformationSeekingScore,
                sentimentResult.InformationTopic
            );

            var toolContext = new AiToolContext
            {
                UserId = userId,
                UserMessage = triggerContent,
                SentimentResult = sentimentResult
            };

            var result = await _toolExecutor.ExecuteAsync(
                toolContext,
                maxTools: 2,
                minRelevanceScore: MinToolRelevanceScore
            );

            if (result.HasContext)
            {
                _logger.LogDebug(
                    "Tools executed successfully: {ToolCount} tools, HasContext={HasContext}",
                    result.ExecutedResults.Count,
                    result.HasContext
                );
                return (result.MergedContextPrompt, result.SuggestedRole ?? RoleRandomizer.SecretaryRole);
            }

            _logger.LogDebug("No context generated from tools");
            return (null, RoleRandomizer.GetRandomRole());
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get context");
            return (null, RoleRandomizer.GetRandomRole());
        }
    }
}