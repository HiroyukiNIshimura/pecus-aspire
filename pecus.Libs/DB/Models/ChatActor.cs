using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// チャット参加者（ユーザーまたはボット）を統一的に扱うエンティティ
/// ChatRoomMember や ChatMessage から参照され、User/Bot への間接参照を提供する
/// </summary>
public class ChatActor
{
    /// <summary>
    /// アクターID（主キー）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 組織ID（外部キー）
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 組織
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// アクタータイプ（ユーザーまたはボット）
    /// </summary>
    public ChatActorType ActorType { get; set; }

    /// <summary>
    /// ユーザーID（ActorType = User の場合に設定）
    /// UserId と BotId は排他的
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// ユーザー
    /// </summary>
    public User? User { get; set; }

    /// <summary>
    /// ボットID（ActorType = Bot の場合に設定）
    /// UserId と BotId は排他的
    /// </summary>
    public int? BotId { get; set; }

    /// <summary>
    /// ボット
    /// </summary>
    public Bot? Bot { get; set; }

    /// <summary>
    /// 表示名（User.Username または Bot.Name のキャッシュ）
    /// </summary>
    public string DisplayName { get; set; } = null!;

    /// <summary>
    /// アバタータイプ（User のアバタータイプまたは Bot 用）
    /// </summary>
    public AvatarType? AvatarType { get; set; }

    /// <summary>
    /// アバターURL/パス（キャッシュ）
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 更新日時（表示名やアバター同期時に更新）
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // ヘルパープロパティ

    /// <summary>
    /// ユーザーかどうか
    /// </summary>
    public bool IsUser => ActorType == ChatActorType.User;

    /// <summary>
    /// ボットかどうか
    /// </summary>
    public bool IsBot => ActorType == ChatActorType.Bot;
}