namespace Pecus.DB.Models;

/// <summary>
/// ログインユーザーエンティティ
/// </summary>
public class User
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ログインID（システム内でユニークなハッシュ文字列）
    /// </summary>
    public required string LoginId { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    public required string Username { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// パスワードハッシュ
    /// </summary>
    public required string PasswordHash { get; set; }

    /// <summary>
    /// アイデンティティアイコンタイプ(gravatar, user-avatar, auto-generated)
    /// </summary>
    public string AvatarType { get; set; } = "auto-generated";

    /// <summary>
    /// アバターURL(AvatarTypeがuser-avatarの場合、アップロードされたファイルのURLを保持)
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// 組織ID
    /// </summary>
    public int? OrganizationId { get; set; }

    /// <summary>
    /// 所属組織
    /// </summary>
    public Organization? Organization { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int? CreatedByUserId { get; set; }

    /// <summary>
    /// 最終ログイン日時
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// このユーザーに割り当てられたロール
    /// </summary>
    public ICollection<Role> Roles { get; set; } = new List<Role>();

    /// <summary>
    /// このユーザーが参加しているワークスペース
    /// </summary>
    public ICollection<WorkspaceUser> WorkspaceUsers { get; set; } = new List<WorkspaceUser>();
}