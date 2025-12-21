using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Services;

/// <summary>
/// Bot からのメッセージ送信サービス。
/// ChatBot や SystemBot などの Bot アクターとしてメッセージを送信する。
/// </summary>
public class BotMessageService
{
    private readonly ApplicationDbContext _context;
    private readonly ChatMessageService _chatMessageService;
    private readonly ChatRoomService _chatRoomService;
    private readonly ILogger<BotMessageService> _logger;

    public BotMessageService(
        ApplicationDbContext context,
        ChatMessageService chatMessageService,
        ChatRoomService chatRoomService,
        ILogger<BotMessageService> logger
    )
    {
        _context = context;
        _chatMessageService = chatMessageService;
        _chatRoomService = chatRoomService;
        _logger = logger;
    }

    /// <summary>
    /// 指定した Bot からルームにメッセージを送信する。
    /// Bot は事前にルームのメンバーである必要がある。
    /// ChatBot の場合、組織設定の GenerativeApiVendor が None の場合はメッセージを送信しない。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">ルームID</param>
    /// <param name="botType">ボットタイプ（ChatBot, SystemBot など）</param>
    /// <param name="content">メッセージ内容</param>
    /// <param name="messageType">メッセージタイプ（デフォルト: Text）</param>
    /// <param name="replyToMessageId">返信先メッセージID（オプション）</param>
    /// <returns>作成されたメッセージ。ChatBot で GenerativeApiVendor が None の場合は null</returns>
    public async Task<ChatMessage?> SendMessageAsync(
        int organizationId,
        int roomId,
        BotType botType,
        string content,
        ChatMessageType messageType = ChatMessageType.Text,
        int? replyToMessageId = null
    )
    {
        // ChatBot の場合、GenerativeApiVendor が None なら送信しない
        if (botType == BotType.ChatBot)
        {
            var setting = await _context.OrganizationSettings
                .FirstOrDefaultAsync(s => s.OrganizationId == organizationId);

            if (setting == null || setting.GenerativeApiVendor == GenerativeApiVendor.None)
            {
                _logger.LogInformation(
                    "ChatBot message skipped: OrganizationId={OrganizationId}, GenerativeApiVendor is None or setting not found",
                    organizationId
                );
                return null;
            }
        }

        // Bot と ChatActor を取得
        var bot = await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == botType);

        if (bot == null)
        {
            throw new NotFoundException($"組織ID {organizationId} に {botType} が見つかりません。");
        }

        if (bot.ChatActor == null)
        {
            throw new NotFoundException($"{botType} の ChatActor が見つかりません。");
        }

        // Bot がルームのメンバーか確認
        var isMember = await _context.ChatRoomMembers.AnyAsync(m =>
            m.ChatRoomId == roomId && m.ChatActorId == bot.ChatActor.Id);

        if (!isMember)
        {
            throw new BadRequestException($"{botType} はこのルームのメンバーではありません。");
        }

        // メッセージ送信（ChatMessageService を利用）
        var message = await _chatMessageService.SendMessageAsync(
            roomId,
            bot.ChatActor.Id,
            content,
            messageType,
            replyToMessageId
        );

        _logger.LogInformation(
            "Bot message sent: BotType={BotType}, RoomId={RoomId}, MessageId={MessageId}",
            botType,
            roomId,
            message.Id
        );

        return message;
    }

    /// <summary>
    /// ChatBot（Coati Bot）からメッセージを送信する。
    /// 主にグループチャットや AI ルームでの応答に使用。
    /// 組織設定の GenerativeApiVendor が None の場合はメッセージを送信しない。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">ルームID</param>
    /// <param name="content">メッセージ内容</param>
    /// <param name="replyToMessageId">返信先メッセージID（オプション）</param>
    /// <returns>作成されたメッセージ。GenerativeApiVendor が None の場合は null</returns>
    public async Task<ChatMessage?> SendChatBotMessageAsync(
        int organizationId,
        int roomId,
        string content,
        int? replyToMessageId = null
    )
    {
        return await SendMessageAsync(
            organizationId,
            roomId,
            BotType.ChatBot,
            content,
            ChatMessageType.Text,
            replyToMessageId
        );
    }

    /// <summary>
    /// SystemBot（System Bot）から組織のシステムルームにメッセージを送信する。
    /// システムルームは自動的に取得または作成される。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="content">メッセージ内容</param>
    /// <returns>作成されたメッセージ</returns>
    public async Task<ChatMessage> SendSystemBotMessageAsync(
        int organizationId,
        string content
    )
    {
        // SystemBot を取得
        var systemBot = await GetSystemBotAsync(organizationId);
        if (systemBot?.ChatActor == null)
        {
            throw new NotFoundException($"組織ID {organizationId} に SystemBot が見つかりません。");
        }

        // システムルームを取得または作成（SystemBot の UserId は存在しないため、組織の最初のユーザーを使用）
        var systemRoom = await _chatRoomService.GetOrCreateSystemRoomAsync(
            organizationId,
            createdByUserId: 1  // システムユーザーID
        );

        // SystemBot がルームのメンバーでなければ追加
        var isMember = await _context.ChatRoomMembers.AnyAsync(m =>
            m.ChatRoomId == systemRoom.Id && m.ChatActorId == systemBot.ChatActor.Id);

        if (!isMember)
        {
            _context.ChatRoomMembers.Add(new ChatRoomMember
            {
                ChatRoomId = systemRoom.Id,
                ChatActorId = systemBot.ChatActor.Id,
                Role = ChatRoomRole.Member,
            });
            await _context.SaveChangesAsync();
        }

        // メッセージ送信
        var message = await _chatMessageService.SendMessageAsync(
            systemRoom.Id,
            systemBot.ChatActor.Id,
            content,
            ChatMessageType.System
        );

        _logger.LogInformation(
            "SystemBot message sent: OrganizationId={OrganizationId}, RoomId={RoomId}, MessageId={MessageId}",
            organizationId,
            systemRoom.Id,
            message.Id
        );

        return message;
    }

    /// <summary>
    /// SystemBot（System Bot）から指定したルームにメッセージを送信する。
    /// システムルーム以外に送信したい場合に使用。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">ルームID</param>
    /// <param name="content">メッセージ内容</param>
    /// <returns>作成されたメッセージ</returns>
    public async Task<ChatMessage> SendSystemBotMessageToRoomAsync(
        int organizationId,
        int roomId,
        string content
    )
    {
        // SystemBot は GenerativeApiVendor チェックをスキップするため、常に非 null が返る
        return (await SendMessageAsync(
            organizationId,
            roomId,
            BotType.SystemBot,
            content,
            ChatMessageType.System
        ))!;
    }

    /// <summary>
    /// Bot をルームに参加させる。
    /// Bot がまだメンバーでない場合のみ追加する。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">ルームID</param>
    /// <param name="botType">ボットタイプ</param>
    /// <returns>追加された場合は true、既にメンバーの場合は false</returns>
    public async Task<bool> JoinRoomAsync(int organizationId, int roomId, BotType botType)
    {
        // Bot と ChatActor を取得
        var bot = await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == botType);

        if (bot?.ChatActor == null)
        {
            throw new NotFoundException($"組織ID {organizationId} に {botType} が見つかりません。");
        }

        // ルームの存在確認
        var room = await _context.ChatRooms.FindAsync(roomId);
        if (room == null)
        {
            throw new NotFoundException("チャットルームが見つかりません。");
        }

        // 既にメンバーか確認
        var existingMember = await _context.ChatRoomMembers.FirstOrDefaultAsync(m =>
            m.ChatRoomId == roomId && m.ChatActorId == bot.ChatActor.Id);

        if (existingMember != null)
        {
            return false; // 既にメンバー
        }

        // メンバーとして追加
        var member = new ChatRoomMember
        {
            ChatRoomId = roomId,
            ChatActorId = bot.ChatActor.Id,
            Role = ChatRoomRole.Member,
        };

        _context.ChatRoomMembers.Add(member);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Bot joined room: BotType={BotType}, RoomId={RoomId}, ChatActorId={ChatActorId}",
            botType,
            roomId,
            bot.ChatActor.Id
        );

        return true;
    }

    /// <summary>
    /// Bot をルームから退出させる。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="roomId">ルームID</param>
    /// <param name="botType">ボットタイプ</param>
    /// <returns>退出した場合は true、メンバーでなかった場合は false</returns>
    public async Task<bool> LeaveRoomAsync(int organizationId, int roomId, BotType botType)
    {
        // Bot と ChatActor を取得
        var bot = await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == botType);

        if (bot?.ChatActor == null)
        {
            throw new NotFoundException($"組織ID {organizationId} に {botType} が見つかりません。");
        }

        // メンバーシップを取得
        var member = await _context.ChatRoomMembers.FirstOrDefaultAsync(m =>
            m.ChatRoomId == roomId && m.ChatActorId == bot.ChatActor.Id);

        if (member == null)
        {
            return false; // メンバーではない
        }

        _context.ChatRoomMembers.Remove(member);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Bot left room: BotType={BotType}, RoomId={RoomId}, ChatActorId={ChatActorId}",
            botType,
            roomId,
            bot.ChatActor.Id
        );

        return true;
    }

    /// <summary>
    /// 組織の ChatBot（Coati Bot）を取得する。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>Bot エンティティ（ChatActor 含む）</returns>
    public async Task<Bot?> GetChatBotAsync(int organizationId)
    {
        return await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == BotType.ChatBot);
    }

    /// <summary>
    /// 組織の SystemBot（System Bot）を取得する。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>Bot エンティティ（ChatActor 含む）</returns>
    public async Task<Bot?> GetSystemBotAsync(int organizationId)
    {
        return await _context.Bots
            .Include(b => b.ChatActor)
            .FirstOrDefaultAsync(b =>
                b.OrganizationId == organizationId &&
                b.Type == BotType.SystemBot);
    }

    /// <summary>
    /// ユーザーの AI ルームに ChatBot からウェルカムメッセージを送信する。
    /// AI ルームが存在しない場合は作成する。
    /// 組織設定の GenerativeApiVendor が None の場合はメッセージを送信しない。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="userId">ユーザーID</param>
    /// <param name="username">ユーザー名（メッセージに含める）</param>
    /// <returns>作成されたメッセージ。GenerativeApiVendor が None の場合は null</returns>
    public async Task<ChatMessage?> SendLoginWelcomeMessageAsync(
        int organizationId,
        int userId,
        string username
    )
    {
        // AI ルームを取得または作成
        var aiRoom = await _chatRoomService.GetOrCreateAiRoomAsync(userId, organizationId);

        // ChatBot をルームに参加させる（まだ参加していない場合）
        await JoinRoomAsync(organizationId, aiRoom.Id, BotType.ChatBot);

        // ウェルカムメッセージを送信
        var content = $"👋 {username}さん、おかえりなさい！\n\n何かお手伝いできることはありますか？タスクの確認や質問など、お気軽にどうぞ。";

        return await SendChatBotMessageAsync(
            organizationId,
            aiRoom.Id,
            content
        );
    }
}
