using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Hubs;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Services;

/// <summary>
/// チャットメッセージ管理サービス
/// </summary>
public class ChatMessageService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<ChatMessageService> _logger;

    public ChatMessageService(
        ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext,
        ILogger<ChatMessageService> logger
    )
    {
        _context = context;
        _hubContext = hubContext;
        _logger = logger;
    }

    #region メッセージ送信

    /// <summary>
    /// メッセージを送信
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="senderUserId">送信者ユーザーID（AI メッセージの場合は null）</param>
    /// <param name="content">メッセージ内容</param>
    /// <param name="messageType">メッセージタイプ</param>
    /// <param name="replyToMessageId">返信先メッセージID</param>
    /// <returns>作成されたメッセージ</returns>
    public async Task<ChatMessage> SendMessageAsync(
        int roomId,
        int? senderUserId,
        string content,
        ChatMessageType messageType = ChatMessageType.Text,
        int? replyToMessageId = null
    )
    {
        // ルームの存在確認
        var room = await _context.ChatRooms.FindAsync(roomId);
        if (room == null)
        {
            throw new NotFoundException("チャットルームが見つかりません。");
        }

        // ユーザーの場合、メンバー確認
        if (senderUserId.HasValue)
        {
            var isMember = await _context.ChatRoomMembers.AnyAsync(m =>
                m.ChatRoomId == roomId && m.UserId == senderUserId.Value
            );

            if (!isMember)
            {
                throw new BadRequestException("このルームのメンバーではありません。");
            }
        }

        // 返信先メッセージの確認
        if (replyToMessageId.HasValue)
        {
            var replyToMessage = await _context.ChatMessages.FindAsync(replyToMessageId.Value);
            if (replyToMessage == null || replyToMessage.ChatRoomId != roomId)
            {
                throw new BadRequestException("返信先メッセージが見つかりません。");
            }
        }

        // メッセージ作成
        var message = new ChatMessage
        {
            ChatRoomId = roomId,
            SenderUserId = senderUserId,
            MessageType = messageType,
            Content = content,
            ReplyToMessageId = replyToMessageId,
        };

        _context.ChatMessages.Add(message);

        // ルームの UpdatedAt を更新
        room.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();

        // Navigation Property を読み込み
        if (senderUserId.HasValue)
        {
            await _context.Entry(message).Reference(m => m.SenderUser).LoadAsync();
        }
        if (replyToMessageId.HasValue)
        {
            await _context.Entry(message).Reference(m => m.ReplyToMessage).LoadAsync();
        }

        // SignalR 通知を送信
        await SendMessageNotificationAsync(room, message);

        _logger.LogDebug(
            "Message sent: MessageId={MessageId}, RoomId={RoomId}, SenderUserId={SenderUserId}",
            message.Id,
            roomId,
            senderUserId
        );

        return message;
    }

    /// <summary>
    /// システムメッセージを送信
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="content">メッセージ内容</param>
    /// <returns>作成されたメッセージ</returns>
    public async Task<ChatMessage> SendSystemMessageAsync(int roomId, string content)
    {
        return await SendMessageAsync(roomId, null, content, ChatMessageType.System);
    }

    /// <summary>
    /// AI メッセージを送信
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="content">メッセージ内容</param>
    /// <param name="replyToMessageId">返信先メッセージID</param>
    /// <returns>作成されたメッセージ</returns>
    public async Task<ChatMessage> SendAiMessageAsync(
        int roomId,
        string content,
        int? replyToMessageId = null
    )
    {
        return await SendMessageAsync(roomId, null, content, ChatMessageType.Ai, replyToMessageId);
    }

    #endregion

    #region メッセージ取得

    /// <summary>
    /// ルームのメッセージを取得（ページネーション対応）
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="limit">取得件数</param>
    /// <param name="cursor">カーソル（このメッセージより前のメッセージを取得）</param>
    /// <returns>メッセージ一覧</returns>
    public async Task<(List<ChatMessage> Messages, int? NextCursor)> GetMessagesAsync(
        int roomId,
        int limit = 50,
        int? cursor = null
    )
    {
        var query = _context
            .ChatMessages.Include(m => m.SenderUser)
            .Include(m => m.ReplyToMessage)
            .Where(m => m.ChatRoomId == roomId);

        if (cursor.HasValue)
        {
            query = query.Where(m => m.Id < cursor.Value);
        }

        var messages = await query.OrderByDescending(m => m.Id).Take(limit + 1).ToListAsync();

        int? nextCursor = null;
        if (messages.Count > limit)
        {
            nextCursor = messages[limit].Id;
            messages = messages.Take(limit).ToList();
        }

        // 古い順に並べ替えて返す
        messages.Reverse();

        return (messages, nextCursor);
    }

    /// <summary>
    /// 指定メッセージIDより新しいメッセージを取得
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="afterMessageId">このメッセージIDより後のメッセージを取得</param>
    /// <param name="limit">取得件数</param>
    /// <returns>メッセージ一覧</returns>
    public async Task<List<ChatMessage>> GetMessagesAfterAsync(
        int roomId,
        int afterMessageId,
        int limit = 100
    )
    {
        return await _context
            .ChatMessages.Include(m => m.SenderUser)
            .Include(m => m.ReplyToMessage)
            .Where(m => m.ChatRoomId == roomId && m.Id > afterMessageId)
            .OrderBy(m => m.Id)
            .Take(limit)
            .ToListAsync();
    }

    /// <summary>
    /// メッセージIDでメッセージを取得
    /// </summary>
    /// <param name="messageId">メッセージID</param>
    /// <returns>メッセージ</returns>
    public async Task<ChatMessage?> GetMessageByIdAsync(int messageId)
    {
        return await _context
            .ChatMessages.Include(m => m.SenderUser)
            .Include(m => m.ReplyToMessage)
            .FirstOrDefaultAsync(m => m.Id == messageId);
    }

    #endregion

    #region 未読/統計

    /// <summary>
    /// ルームの最新メッセージを取得
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <returns>最新メッセージ</returns>
    public async Task<ChatMessage?> GetLatestMessageAsync(int roomId)
    {
        return await _context
            .ChatMessages.Include(m => m.SenderUser)
            .Where(m => m.ChatRoomId == roomId)
            .OrderByDescending(m => m.Id)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// ルームのメッセージ件数を取得
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <returns>メッセージ件数</returns>
    public async Task<int> GetMessageCountAsync(int roomId)
    {
        return await _context.ChatMessages.CountAsync(m => m.ChatRoomId == roomId);
    }

    #endregion

    #region SignalR 通知

    /// <summary>
    /// メッセージ通知を送信
    /// </summary>
    private async Task SendMessageNotificationAsync(ChatRoom room, ChatMessage message)
    {
        string groupName;
        string eventType;

        // System ルームは organization グループに通知、それ以外は chat グループに通知
        if (room.Type == ChatRoomType.System)
        {
            groupName = $"organization:{room.OrganizationId}";
            eventType = "chat:system_message";
        }
        else
        {
            groupName = $"chat:{room.Id}";
            eventType = "chat:message_received";
        }

        var payload = new
        {
            RoomId = room.Id,
            RoomType = room.Type.ToString(),
            Message = new
            {
                message.Id,
                message.SenderUserId,
                message.MessageType,
                message.Content,
                message.ReplyToMessageId,
                message.CreatedAt,
                // 送信者情報（アバター表示用）
                Sender = message.SenderUser != null
                    ? new
                    {
                        Id = message.SenderUser.Id,
                        Username = message.SenderUser.Username,
                        Email = message.SenderUser.Email,
                        AvatarType = message.SenderUser.AvatarType?.ToString()?.ToLowerInvariant(),
                        IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                            message.SenderUser.AvatarType,
                            message.SenderUser.Id,
                            message.SenderUser.Username,
                            message.SenderUser.Email,
                            message.SenderUser.UserAvatarPath
                        ),
                        IsActive = message.SenderUser.IsActive,
                    }
                    : null,
            },
        };

        // チャットルームグループに新メッセージを通知（チャット画面を開いている人向け）
        await _hubContext
            .Clients.Group(groupName)
            .SendAsync(
                "ReceiveNotification",
                new
                {
                    EventType = eventType,
                    Payload = payload,
                    Timestamp = DateTimeOffset.UtcNow,
                }
            );

        _logger.LogDebug(
            "Notification sent: EventType={EventType}, GroupName={GroupName}",
            eventType,
            groupName
        );

        // organization グループに未読バッジ更新を通知（全ユーザー向け）
        // System ルームは既に organization に通知しているのでスキップ
        if (room.Type != ChatRoomType.System)
        {
            var orgGroupName = $"organization:{room.OrganizationId}";
            await _hubContext
                .Clients.Group(orgGroupName)
                .SendAsync(
                    "ReceiveNotification",
                    new
                    {
                        EventType = "chat:unread_updated",
                        Payload = new
                        {
                            RoomId = room.Id,
                            RoomType = room.Type.ToString(),
                            SenderUserId = message.SenderUserId,
                        },
                        Timestamp = DateTimeOffset.UtcNow,
                    }
                );

            _logger.LogDebug(
                "Unread badge notification sent: OrganizationGroup={OrgGroupName}, RoomId={RoomId}",
                orgGroupName,
                room.Id
            );
        }
    }

    #endregion
}
