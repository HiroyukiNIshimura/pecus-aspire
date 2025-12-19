using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// チャットルームエンティティ
/// DM、グループチャット、AIチャット、システム通知を統一的に管理
/// </summary>
public class ChatRoom
{
    /// <summary>
    /// チャットルームID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// チャットルームタイプ
    /// </summary>
    public ChatRoomType Type { get; set; }

    /// <summary>
    /// ルーム名（Group/Ai/System の場合に使用、Dm は null）
    /// </summary>
    [MaxLength(100)]
    public string? Name { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 組織
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// DM の重複防止用ユーザーペア
    /// 小さいID_大きいID 形式（例: "5_12"）
    /// Dm タイプの場合のみ使用
    /// </summary>
    [MaxLength(50)]
    public string? DmUserPair { get; set; }

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// 作成者ユーザー
    /// </summary>
    public User CreatedByUser { get; set; } = null!;

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 更新日時（最終メッセージ送信時に更新）
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }

    // Navigation Properties

    /// <summary>
    /// チャットルームメンバー
    /// </summary>
    public ICollection<ChatRoomMember> Members { get; set; } = new List<ChatRoomMember>();

    /// <summary>
    /// チャットメッセージ
    /// </summary>
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
