namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザー情報レスポンス
/// </summary>
public class UserResponse
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ログインID
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
    /// アバタータイプ
    /// </summary>
    public string AvatarType { get; set; } = "auto-generated";

    /// <summary>
    /// アイデンティティアイコンURL
    /// </summary>
    public string? IdentityIconUrl { get; set; }

    /// <summary>
    /// ユーザーのロール一覧
    /// </summary>
    public List<UserRoleResponse> Roles { get; set; } = new();

    /// <summary>
    /// ユーザーのスキル一覧
    /// </summary>
    public List<UserSkillResponse> Skills { get; set; } = new();

    /// <summary>
    /// 管理者権限を持つかどうか
    /// </summary>
    public bool IsAdmin { get; set; }

    /// <summary>
    /// アクティブなユーザーかどうか
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
