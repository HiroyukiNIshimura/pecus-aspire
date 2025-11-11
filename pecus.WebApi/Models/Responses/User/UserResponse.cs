using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザー情報レスポンス
/// </summary>
public class UserResponse : IConflictModel
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ログインID
    /// </summary>
    [Required]
    public required string LoginId { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    [Required]
    public required string Username { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [Required]
    public required string Email { get; set; }

    /// <summary>
    /// アバタータイプ
    /// </summary>
    public AvatarType? AvatarType { get; set; }

    /// <summary>
    /// アイデンティティアイコンURL
    /// </summary>
    public string? IdentityIconUrl { get; set; }

    /// <summary>
    /// ユーザーのロール一覧
    /// </summary>
    [Required]
    public required List<UserRoleResponse> Roles { get; set; } = new();

    /// <summary>
    /// ユーザーのスキル一覧
    /// </summary>
    public List<UserSkillResponse> Skills { get; set; } = new();

    /// <summary>
    /// 管理者権限を持つかどうか
    /// </summary>
    [Required]
    public required bool IsAdmin { get; set; }

    /// <summary>
    /// アクティブなユーザーかどうか
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// ユーザーの楽観的ロック用RowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}

