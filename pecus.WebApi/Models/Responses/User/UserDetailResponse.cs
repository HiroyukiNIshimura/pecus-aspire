using Pecus.Models.Responses.Permission;
using Pecus.Models.Responses.Role;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザー詳細レスポンス
/// </summary>
public class UserDetailResponse
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
    /// アクティブ状態
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最終ログイン日時
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// ユーザーのロール一覧
    /// </summary>
    public List<RoleInfoResponse> Roles { get; set; } = new();

    /// <summary>
    /// ユーザーの権限一覧（ロールから取得）
    /// </summary>
    public List<PermissionInfoResponse> Permissions { get; set; } = new();
}
