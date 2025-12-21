using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// チャットルームメンバーエンティティ
/// チャットルームの参加者を管理する中間テーブル
/// ChatActor を経由してユーザーまたはボットを参照
/// </summary>
public class ChatRoomMember
{
    /// <summary>
    /// メンバーID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// チャットルームID
    /// </summary>
    public int ChatRoomId { get; set; }

    /// <summary>
    /// チャットルーム
    /// </summary>
    public ChatRoom ChatRoom { get; set; } = null!;

    /// <summary>
    /// チャットアクターID（ユーザーまたはボット）
    /// </summary>
    public int ChatActorId { get; set; }

    /// <summary>
    /// チャットアクター
    /// </summary>
    public ChatActor ChatActor { get; set; } = null!;

    /// <summary>
    /// ルーム内での役割
    /// </summary>
    public ChatRoomRole Role { get; set; } = ChatRoomRole.Member;

    /// <summary>
    /// 参加日時
    /// </summary>
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 最終既読日時（この日時以前のメッセージは既読）
    /// ボットの場合は通常 null
    /// </summary>
    public DateTimeOffset? LastReadAt { get; set; }

    /// <summary>
    /// 通知設定（ミュートなど）
    /// </summary>
    public ChatNotificationSetting NotificationSetting { get; set; } = ChatNotificationSetting.All;
}
