using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks.Bot;
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
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        ChatRoomService chatRoomService,
        ChatMessageService chatMessageService,
        OrganizationService organizationService,
        OrganizationAccessHelper accessHelper,
        IBackgroundJobClient backgroundJobClient,
        ProfileService profileService,
        ILogger<ChatController> logger
    )
        : base(profileService, logger)
    {
        _chatRoomService = chatRoomService;
        _chatMessageService = chatMessageService;
        _organizationService = organizationService;
        _accessHelper = accessHelper;
        _backgroundJobClient = backgroundJobClient;
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
        var rooms = await _chatRoomService.GetUserRoomsAsync(
            CurrentUserId,
            CurrentOrganizationId,
            type
        );

        _logger.LogDebug(
            "GetRooms: UserId={UserId}, OrganizationId={OrganizationId}, Type={Type}, RoomCount={RoomCount}, RoomIds={RoomIds}",
            CurrentUserId,
            CurrentOrganizationId,
            type,
            rooms.Count,
            string.Join(",", rooms.Select(r => $"{r.Id}({r.Type})")));

        // GroupChatScope に応じてグループルームをフィルタリング
        var organization = await _organizationService.GetOrganizationByIdAsync(CurrentOrganizationId);
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
            var member = room.Members.FirstOrDefault(m => m.ChatActor.UserId == CurrentUserId);
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
                var otherMember = room.Members.FirstOrDefault(m => m.ChatActor.UserId != CurrentUserId);
                if (otherMember?.ChatActor != null)
                {
                    item.OtherUser = MapToChatUserItemFromActor(otherMember.ChatActor);
                    item.Name = otherMember.ChatActor.DisplayName;
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
        var member = room.Members.FirstOrDefault(m => m.ChatActor.UserId == CurrentUserId)
            ?? throw new NotFoundException("このルームのメンバーではありません。");

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => MapToChatRoomMemberItem(m)).ToList(),
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
        var room = await _chatRoomService.GetOrCreateDmRoomAsync(
            CurrentUserId,
            request.TargetUserId,
            CurrentOrganizationId
        );

        var member = room.Members.FirstOrDefault(m => m.ChatActor.UserId == CurrentUserId);

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => MapToChatRoomMemberItem(m)).ToList(),
            NotificationSetting = member?.NotificationSetting ?? ChatNotificationSetting.All,
            LastReadAt = member?.LastReadAt,
            RowVersion = room.RowVersion,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// DM候補ユーザー一覧を取得（既存DMがないアクティブユーザー）
    /// </summary>
    /// <param name="limit">取得件数（デフォルト10、最大50）</param>
    /// <remarks>
    /// DMタブで「他のメンバー」セクションに表示する、既存DMがないユーザーを取得します。
    /// 最終ログイン日時でソートされ、最近アクティブなユーザーが優先されます。
    /// </remarks>
    [HttpGet("dm-candidates")]
    [ProducesResponseType(typeof(List<DmCandidateUserItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<DmCandidateUserItem>>> GetDmCandidateUsers([FromQuery] int limit = 10)
    {
        // 上限を50に制限
        var effectiveLimit = Math.Min(limit, 50);

        var users = await _chatRoomService.GetDmCandidateUsersAsync(
            CurrentUserId,
            CurrentOrganizationId,
            effectiveLimit
        );

        var response = users.Select(u => new DmCandidateUserItem
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            AvatarType = u.AvatarType?.ToString()?.ToLowerInvariant(),
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                u.AvatarType,
                u.Id,
                u.Username,
                u.Email,
                u.UserAvatarPath
            ),
            LastActiveAt = u.LastLoginAt,
        }).ToList();

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
        var room = await _chatRoomService.GetOrCreateAiRoomAsync(
            CurrentUserId,
            CurrentOrganizationId
        );

        var member = room.Members.FirstOrDefault(m => m.ChatActor.UserId == CurrentUserId);

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => MapToChatRoomMemberItem(m)).ToList(),
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
        // GroupChatScope が Workspace の場合は利用不可
        var organization = await _organizationService.GetOrganizationByIdAsync(CurrentOrganizationId);
        if (organization?.Setting?.GroupChatScope == GroupChatScope.Workspace)
        {
            throw new NotFoundException("この組織ではワークスペース単位のグループチャットが設定されています。");
        }

        var room = await _chatRoomService.GetOrCreateGroupRoomAsync(
            CurrentOrganizationId,
            CurrentUserId
        );

        var member = room.Members.FirstOrDefault(m => m.ChatActor.UserId == CurrentUserId);

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => MapToChatRoomMemberItem(m)).ToList(),
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
        var room = await _chatRoomService.GetOrCreateSystemRoomAsync(
            CurrentOrganizationId,
            CurrentUserId
        );

        var member = room.Members.FirstOrDefault(m => m.ChatActor.UserId == CurrentUserId);

        var response = new ChatRoomDetailResponse
        {
            Id = room.Id,
            Type = room.Type,
            Name = room.Name,
            Members = room.Members.Select(m => MapToChatRoomMemberItem(m)).ToList(),
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
        // GroupChatScope が Organization の場合は利用不可
        var organization = await _organizationService.GetOrganizationByIdAsync(CurrentOrganizationId);
        if (organization?.Setting?.GroupChatScope == GroupChatScope.Organization)
        {
            throw new NotFoundException("この組織では組織単位のグループチャットが設定されています。");
        }

        var room = await _chatRoomService.GetOrCreateWorkspaceGroupRoomAsync(
            workspaceId,
            CurrentUserId
        );

        var member = room.Members.FirstOrDefault(m => m.ChatActor.UserId == CurrentUserId);
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
            Members = room.Members.Select(m => MapToChatRoomMemberItem(m)).ToList(),
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

        // ユーザーの ChatActor ID を取得
        var senderActorId = await _chatRoomService.GetUserActorIdAsync(CurrentUserId);
        if (senderActorId == null)
        {
            throw new NotFoundException("チャットアクターが見つかりません。");
        }

        var message = await _chatMessageService.SendMessageAsync(
            roomId,
            senderActorId.Value,
            request.Content,
            request.MessageType ?? ChatMessageType.Text,
            request.ReplyToMessageId
        );

        // AI ルームへのメッセージの場合、AI機能が有効ならAI 返信タスクをキュー
        var room = await _chatRoomService.GetRoomByIdAsync(roomId);
        if (room?.Type == ChatRoomType.Ai &&
            await _accessHelper.IsAiEnabledAsync(CurrentOrganizationId))
        {
            _backgroundJobClient.Enqueue<AiChatReplyTask>(x =>
                x.SendReplyAsync(
                    CurrentOrganizationId,
                    roomId,
                    message.Id,
                    CurrentUserId
                )
            );

            _logger.LogDebug(
                "Enqueued AI chat reply task: RoomId={RoomId}, MessageId={MessageId}",
                roomId,
                message.Id
            );
        }

        // グループチャットの場合、AI機能が有効ならBot返信タスクをキュー
        if (room?.Type == ChatRoomType.Group &&
            await _accessHelper.IsAiEnabledAsync(CurrentOrganizationId))
        {
            // ワークスペースのメンバーに対して通知を送信するバックグラウンドジョブをキュー
            _backgroundJobClient.Enqueue<GroupChatReplyTask>(x =>
                x.SendReplyAsync(
                    CurrentOrganizationId,
                    roomId,
                    message.Id,
                    CurrentUserId
                )
            );

            _logger.LogDebug(
                "Enqueued Group chat reply task: RoomId={RoomId}, MessageId={MessageId}",
                roomId,
                message.Id
            );
        }

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
        var totalUnread = await _chatRoomService.GetTotalUnreadCountAsync(
            CurrentUserId,
            CurrentOrganizationId
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
        var unreadByCategory = await _chatRoomService.GetUnreadCountByCategoryAsync(
            CurrentUserId,
            CurrentOrganizationId
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

    private static ChatRoomMemberItem MapToChatRoomMemberItem(Pecus.Libs.DB.Models.ChatRoomMember member)
    {
        return new ChatRoomMemberItem
        {
            UserId = member.ChatActor.UserId ?? 0,  // Bot の場合は 0
            Username = member.ChatActor.DisplayName,
            Email = member.ChatActor.User?.Email ?? "",
            AvatarType = member.ChatActor.AvatarType?.ToString()?.ToLowerInvariant(),
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                member.ChatActor.AvatarType,
                member.ChatActor.UserId ?? 0,
                member.ChatActor.DisplayName,
                member.ChatActor.User?.Email ?? "",
                member.ChatActor.AvatarUrl
            ),
            Role = member.Role,
            JoinedAt = member.JoinedAt,
            LastReadAt = member.LastReadAt,
        };
    }

    private static ChatUserItem MapToChatUserItemFromActor(Pecus.Libs.DB.Models.ChatActor actor)
    {
        // Bot の場合は AvatarUrl を直接使用（IconUrl が格納されている）
        // User の場合は IdentityIconHelper を使用
        var identityIconUrl = actor.ActorType == ChatActorType.Bot
            ? actor.AvatarUrl ?? ""
            : IdentityIconHelper.GetIdentityIconUrl(
                actor.AvatarType,
                actor.UserId ?? 0,
                actor.DisplayName,
                actor.User?.Email ?? "",
                actor.AvatarUrl
            );

        return new ChatUserItem
        {
            Id = actor.UserId ?? 0,  // Bot の場合は 0
            Username = actor.DisplayName,
            Email = actor.User?.Email ?? "",
            AvatarType = actor.AvatarType?.ToString()?.ToLowerInvariant(),
            IdentityIconUrl = identityIconUrl,
            IsActive = actor.User?.IsActive ?? true,
        };
    }

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
            SenderUserId = message.SenderActor?.UserId,
            MessageType = message.MessageType,
            Content = message.Content,
            ReplyToMessageId = message.ReplyToMessageId,
            CreatedAt = message.CreatedAt,
        };

        if (message.SenderActor != null)
        {
            item.Sender = MapToChatUserItemFromActor(message.SenderActor);
        }

        if (message.ReplyToMessage != null)
        {
            item.ReplyTo = new ChatMessageReplyItem
            {
                Id = message.ReplyToMessage.Id,
                SenderUserId = message.ReplyToMessage.SenderActor?.UserId,
                SenderUsername = message.ReplyToMessage.SenderActor?.DisplayName,
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