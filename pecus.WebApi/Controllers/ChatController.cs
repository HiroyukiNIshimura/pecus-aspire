using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// チャットコントローラー
/// </summary>
[Route("api/chat")]
[Produces("application/json")]
[Tags("Chat")]
public class ChatController : BaseSecureController
{
    private readonly ChatRoomService _chatRoomService;
    private readonly ChatMessageService _chatMessageService;
    private readonly OrganizationService _organizationService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        ChatRoomService chatRoomService,
        ChatMessageService chatMessageService,
        OrganizationService organizationService,
        ProfileService profileService,
        ILogger<ChatController> logger
    )
        : base(profileService, logger)
    {
        _chatRoomService = chatRoomService;
        _chatMessageService = chatMessageService;
        _organizationService = organizationService;
        _logger = logger;
    }

    #region ルーム関連

    /// <summary>
    /// 参加しているルーム一覧を取得
    /// </summary>
    /// <param name="type">ルームタイプでフィルタ（省略時は全タイプ）</param>
    [HttpGet("rooms")]
    [ProducesResponseType(typeof(List<ChatRoomItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<ChatRoomItem>>> GetRooms([FromQuery] ChatRoomType? type = null)
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織情報が見つかりません。");
        }

        var rooms = await _chatRoomService.GetUserRoomsAsync(
            CurrentUserId,
            CurrentUser.OrganizationId.Value,
            type
        );

        // GroupChatScope に応じてグループルームをフィルタリング
        var organization = await _organizationService.GetOrganizationByIdAsync(CurrentUser.OrganizationId.Value);
        var groupChatScope = organization?.Setting?.GroupChatScope ?? GroupChatScope.Workspace;

        // Group タイプのルームをフィルタ
        var filteredRooms = rooms.Where(room =>
        {
            if (room.Type != ChatRoomType.Group)
            {
                return true; // Group 以外はそのまま返す
            }

            // GroupChatScope に応じてフィルタ
            return groupChatScope switch
            {
                // Workspace モード: WorkspaceId が設定されているルームのみ
                GroupChatScope.Workspace => room.WorkspaceId != null,
                // Organization モード: WorkspaceId が null のルームのみ（組織全体のグループ）
                GroupChatScope.Organization => room.WorkspaceId == null,
                _ => true,
            };
        }).ToList();

        var response = new List<ChatRoomItem>();

        foreach (var room in filteredRooms)
        {
            var member = room.Members.FirstOrDefault(m => m.UserId == CurrentUserId);
            var unreadCount = await _chatRoomService.GetUnreadCountAsync(room.Id, CurrentUserId);
            var latestMessage = await _chatMessageService.GetLatestMessageAsync(room.Id);

            var item = new ChatRoomItem
            {
                Id = room.Id,
                Type = room.Type,
                Name = room.Name,
                WorkspaceId = room.WorkspaceId,
                NotificationSetting = member?.NotificationSetting ?? ChatNotificationSetting.All,
                UnreadCount = unreadCount,
                CreatedAt = room.CreatedAt,
                UpdatedAt = room.UpdatedAt,
            };

            // DM の場合は相手ユーザー情報を設定
            if (room.Type == ChatRoomType.Dm)
            {
                var otherMember = room.Members.FirstOrDefault(m => m.UserId != CurrentUserId);
                if (otherMember?.User != null)
                {
                    item.OtherUser = MapToUserItem(otherMember.User);
                    item.Name = otherMember.User.Username;
                }
            }

            // 最新メッセージを設定
            if (latestMessage != null)
            {
                item.LatestMessage = MapToMessageItem(latestMessage);
            }

            response.Add(item);
        }

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ルーム詳細を取得
    /// </summary>
    /// <param name="roomId">ルームID</param>
    [HttpGet("rooms/{roomId:int}")]
    [ProducesResponseType(typeof(ChatRoomDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ChatRoomDetailResponse>> GetRoom(int roomId)
    {
        var room = await _chatRoomService.GetRoomByIdAsync(roomId);
        if (room == null)
        {
            throw new NotFoundException("チャットルームが見つかりません。");
        }

        // メンバーチェック
        var member = room.Members.FirstOrDefault(m => m.UserId == CurrentUserId)
            ?? throw new NotFoundException("このルームのメンバーではありません。");

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => new ChatRoomMemberItem
            {
                UserId = m.UserId,
                Username = m.User?.Username ?? "",
                Email = m.User?.Email ?? "",
                AvatarType = m.User?.AvatarType?.ToString()?.ToLowerInvariant(),
                Role = m.Role,
                JoinedAt = m.JoinedAt,
            }).ToList(),
            NotificationSetting = member.NotificationSetting,
            LastReadAt = member.LastReadAt,
            RowVersion = room.RowVersion,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// DM ルームを作成または取得
    /// </summary>
    /// <param name="request">DM ルーム作成リクエスト</param>
    [HttpPost("rooms/dm")]
    [ProducesResponseType(typeof(ChatRoomDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ChatRoomDetailResponse>> CreateOrGetDmRoom(
        [FromBody] CreateDmRoomRequest request
    )
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織情報が見つかりません。");
        }

        var room = await _chatRoomService.GetOrCreateDmRoomAsync(
            CurrentUserId,
            request.TargetUserId,
            CurrentUser.OrganizationId.Value
        );

        var member = room.Members.FirstOrDefault(m => m.UserId == CurrentUserId);

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => new ChatRoomMemberItem
            {
                UserId = m.UserId,
                Username = m.User?.Username ?? "",
                Email = m.User?.Email ?? "",
                AvatarType = m.User?.AvatarType?.ToString()?.ToLowerInvariant(),
                Role = m.Role,
                JoinedAt = m.JoinedAt,
            }).ToList(),
            NotificationSetting = member?.NotificationSetting ?? ChatNotificationSetting.All,
            LastReadAt = member?.LastReadAt,
            RowVersion = room.RowVersion,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// AI ルームを作成または取得
    /// </summary>
    [HttpPost("rooms/ai")]
    [ProducesResponseType(typeof(ChatRoomDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ChatRoomDetailResponse>> CreateOrGetAiRoom()
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織情報が見つかりません。");
        }

        var room = await _chatRoomService.GetOrCreateAiRoomAsync(
            CurrentUserId,
            CurrentUser.OrganizationId.Value
        );

        var member = room.Members.FirstOrDefault(m => m.UserId == CurrentUserId);

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => new ChatRoomMemberItem
            {
                UserId = m.UserId,
                Username = m.User?.Username ?? "",
                Email = m.User?.Email ?? "",
                AvatarType = m.User?.AvatarType?.ToString()?.ToLowerInvariant(),
                Role = m.Role,
                JoinedAt = m.JoinedAt,
            }).ToList(),
            NotificationSetting = member?.NotificationSetting ?? ChatNotificationSetting.All,
            LastReadAt = member?.LastReadAt,
            RowVersion = room.RowVersion,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// グループルームを取得（組織単位のグループチャット）
    /// </summary>
    /// <remarks>
    /// 組織設定の GroupChatScope が Organization の場合のみ利用可能。
    /// Workspace の場合は 404 を返す。
    /// </remarks>
    [HttpGet("rooms/group")]
    [ProducesResponseType(typeof(ChatRoomDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ChatRoomDetailResponse>> GetGroupRoom()
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織情報が見つかりません。");
        }

        // GroupChatScope が Workspace の場合は利用不可
        var organization = await _organizationService.GetOrganizationByIdAsync(CurrentUser.OrganizationId.Value);
        if (organization?.Setting?.GroupChatScope == GroupChatScope.Workspace)
        {
            throw new NotFoundException("この組織ではワークスペース単位のグループチャットが設定されています。");
        }

        var room = await _chatRoomService.GetOrCreateGroupRoomAsync(
            CurrentUser.OrganizationId.Value,
            CurrentUserId
        );

        var member = room.Members.FirstOrDefault(m => m.UserId == CurrentUserId);

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => new ChatRoomMemberItem
            {
                UserId = m.UserId,
                Username = m.User?.Username ?? "",
                Email = m.User?.Email ?? "",
                AvatarType = m.User?.AvatarType?.ToString()?.ToLowerInvariant(),
                Role = m.Role,
                JoinedAt = m.JoinedAt,
            }).ToList(),
            NotificationSetting = member?.NotificationSetting ?? ChatNotificationSetting.All,
            LastReadAt = member?.LastReadAt,
            RowVersion = room.RowVersion,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// システムルームを取得
    /// </summary>
    [HttpGet("rooms/system")]
    [ProducesResponseType(typeof(ChatRoomDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ChatRoomDetailResponse>> GetSystemRoom()
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織情報が見つかりません。");
        }

        var room = await _chatRoomService.GetOrCreateSystemRoomAsync(
            CurrentUser.OrganizationId.Value,
            CurrentUserId
        );

        var member = room.Members.FirstOrDefault(m => m.UserId == CurrentUserId);

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => new ChatRoomMemberItem
            {
                UserId = m.UserId,
                Username = m.User?.Username ?? "",
                Email = m.User?.Email ?? "",
                AvatarType = m.User?.AvatarType?.ToString()?.ToLowerInvariant(),
                Role = m.Role,
                JoinedAt = m.JoinedAt,
            }).ToList(),
            NotificationSetting = member?.NotificationSetting ?? ChatNotificationSetting.All,
            LastReadAt = member?.LastReadAt,
            RowVersion = room.RowVersion,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースのグループルームを取得
    /// </summary>
    /// <remarks>
    /// 組織設定の GroupChatScope が Workspace（デフォルト）の場合のみ利用可能。
    /// Organization の場合は 404 を返す。
    /// </remarks>
    /// <param name="workspaceId">ワークスペースID</param>
    [HttpGet("rooms/workspace/{workspaceId:int}/group")]
    [ProducesResponseType(typeof(ChatRoomDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ChatRoomDetailResponse>> GetWorkspaceGroupRoom(int workspaceId)
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織情報が見つかりません。");
        }

        // GroupChatScope が Organization の場合は利用不可
        var organization = await _organizationService.GetOrganizationByIdAsync(CurrentUser.OrganizationId.Value);
        if (organization?.Setting?.GroupChatScope == GroupChatScope.Organization)
        {
            throw new NotFoundException("この組織では組織単位のグループチャットが設定されています。");
        }

        var room = await _chatRoomService.GetOrCreateWorkspaceGroupRoomAsync(
            workspaceId,
            CurrentUserId
        );

        var member = room.Members.FirstOrDefault(m => m.UserId == CurrentUserId);
        if (member == null)
        {
            throw new NotFoundException("このワークスペースのグループチャットメンバーではありません。");
        }

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            WorkspaceId = room.WorkspaceId,
            Members = room.Members.Select(m => new ChatRoomMemberItem
            {
                UserId = m.UserId,
                Username = m.User?.Username ?? "",
                Email = m.User?.Email ?? "",
                AvatarType = m.User?.AvatarType?.ToString()?.ToLowerInvariant(),
                Role = m.Role,
                JoinedAt = m.JoinedAt,
            }).ToList(),
            NotificationSetting = member.NotificationSetting,
            LastReadAt = member.LastReadAt,
            RowVersion = room.RowVersion,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 通知設定を更新
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="request">通知設定更新リクエスト</param>
    [HttpPut("rooms/{roomId:int}/notification")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> UpdateNotificationSetting(
        int roomId,
        [FromBody] UpdateNotificationSettingRequest request
    )
    {
        // メンバーチェック
        if (!await _chatRoomService.IsRoomMemberAsync(roomId, CurrentUserId))
        {
            throw new NotFoundException("このルームのメンバーではありません。");
        }

        await _chatRoomService.UpdateNotificationSettingAsync(roomId, CurrentUserId, request.Setting);

        return TypedResults.NoContent();
    }

    #endregion

    #region メッセージ関連

    /// <summary>
    /// メッセージ一覧を取得
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="request">ページネーションパラメータ</param>
    [HttpGet("rooms/{roomId:int}/messages")]
    [ProducesResponseType(typeof(ChatMessagesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ChatMessagesResponse>> GetMessages(
        int roomId,
        [FromQuery] GetMessagesRequest request
    )
    {
        // メンバーチェック
        if (!await _chatRoomService.IsRoomMemberAsync(roomId, CurrentUserId))
        {
            throw new NotFoundException("このルームのメンバーではありません。");
        }

        var (messages, nextCursor) = await _chatMessageService.GetMessagesAsync(
            roomId,
            request.Limit,
            request.Cursor
        );

        var response = new ChatMessagesResponse
        {
            Messages = messages.Select(MapToMessageItem).ToList(),
            NextCursor = nextCursor,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// メッセージを送信
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="request">メッセージ送信リクエスト</param>
    [HttpPost("rooms/{roomId:int}/messages")]
    [ProducesResponseType(typeof(ChatMessageItem), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<ChatMessageItem>> SendMessage(
        int roomId,
        [FromBody] SendMessageRequest request
    )
    {
        // メンバーチェック
        if (!await _chatRoomService.IsRoomMemberAsync(roomId, CurrentUserId))
        {
            throw new NotFoundException("このルームのメンバーではありません。");
        }

        var message = await _chatMessageService.SendMessageAsync(
            roomId,
            CurrentUserId,
            request.Content,
            request.MessageType ?? ChatMessageType.Text,
            request.ReplyToMessageId
        );

        var response = MapToMessageItem(message);

        return TypedResults.Created($"/api/chat/rooms/{roomId}/messages/{message.Id}", response);
    }

    /// <summary>
    /// 既読位置を更新
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="request">既読位置更新リクエスト</param>
    [HttpPut("rooms/{roomId:int}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> UpdateReadPosition(
        int roomId,
        [FromBody] UpdateReadPositionRequest request
    )
    {
        // メンバーチェック
        if (!await _chatRoomService.IsRoomMemberAsync(roomId, CurrentUserId))
        {
            throw new NotFoundException("このルームのメンバーではありません。");
        }

        await _chatRoomService.UpdateLastReadAtAsync(roomId, CurrentUserId, request.ReadAt, request.ReadMessageId);

        return TypedResults.NoContent();
    }

    /// <summary>
    /// 入力中通知を送信
    /// </summary>
    /// <param name="roomId">ルームID</param>
    /// <param name="request">入力中通知リクエスト</param>
    [HttpPost("rooms/{roomId:int}/typing")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> NotifyTyping(
        int roomId,
        [FromBody] NotifyTypingRequest request
    )
    {
        // メンバーチェック
        if (!await _chatRoomService.IsRoomMemberAsync(roomId, CurrentUserId))
        {
            throw new NotFoundException("このルームのメンバーではありません。");
        }

        await _chatRoomService.SendTypingNotificationAsync(roomId, CurrentUserId, CurrentUser?.Username ?? "", request.IsTyping);

        return TypedResults.NoContent();
    }

    #endregion

    #region 未読関連

    /// <summary>
    /// 全体の未読数を取得
    /// </summary>
    [HttpGet("unread")]
    [ProducesResponseType(typeof(ChatUnreadCountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ChatUnreadCountResponse>> GetUnreadCount()
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織情報が見つかりません。");
        }

        var totalUnread = await _chatRoomService.GetTotalUnreadCountAsync(
            CurrentUserId,
            CurrentUser.OrganizationId.Value
        );

        return TypedResults.Ok(new ChatUnreadCountResponse { TotalUnreadCount = totalUnread });
    }

    /// <summary>
    /// カテゴリ別の未読数を取得
    /// </summary>
    [HttpGet("unread/by-category")]
    [ProducesResponseType(typeof(ChatUnreadCountByCategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<ChatUnreadCountByCategoryResponse>> GetUnreadCountByCategory()
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織情報が見つかりません。");
        }

        var unreadByCategory = await _chatRoomService.GetUnreadCountByCategoryAsync(
            CurrentUserId,
            CurrentUser.OrganizationId.Value
        );

        var response = new ChatUnreadCountByCategoryResponse
        {
            TotalUnreadCount = unreadByCategory.Values.Sum(),
            DmUnreadCount = unreadByCategory[ChatRoomType.Dm],
            GroupUnreadCount = unreadByCategory[ChatRoomType.Group],
            AiUnreadCount = unreadByCategory[ChatRoomType.Ai],
            SystemUnreadCount = unreadByCategory[ChatRoomType.System],
        };

        return TypedResults.Ok(response);
    }

    #endregion

    #region マッピングヘルパー

    private static ChatUserItem MapToUserItem(Pecus.Libs.DB.Models.User user)
    {
        return new ChatUserItem
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            AvatarType = user.AvatarType?.ToString()?.ToLowerInvariant(),
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                user.AvatarType,
                user.Id,
                user.Username,
                user.Email,
                user.UserAvatarPath
            ),
            IsActive = user.IsActive,
        };
    }

    private static ChatMessageItem MapToMessageItem(Pecus.Libs.DB.Models.ChatMessage message)
    {
        var item = new ChatMessageItem
        {
            Id = message.Id,
            SenderUserId = message.SenderUserId,
            MessageType = message.MessageType,
            Content = message.Content,
            ReplyToMessageId = message.ReplyToMessageId,
            CreatedAt = message.CreatedAt,
        };

        if (message.SenderUser != null)
        {
            item.Sender = MapToUserItem(message.SenderUser);
        }

        if (message.ReplyToMessage != null)
        {
            item.ReplyTo = new ChatMessageReplyItem
            {
                Id = message.ReplyToMessage.Id,
                SenderUserId = message.ReplyToMessage.SenderUserId,
                SenderUsername = message.ReplyToMessage.SenderUser?.Username,
                MessageType = message.ReplyToMessage.MessageType,
                ContentPreview = TruncateContent(message.ReplyToMessage.Content, 100),
            };
        }

        return item;
    }

    private static string TruncateContent(string content, int maxLength)
    {
        if (string.IsNullOrEmpty(content) || content.Length <= maxLength)
        {
            return content;
        }
        return content[..maxLength] + "...";
    }

    #endregion
}
