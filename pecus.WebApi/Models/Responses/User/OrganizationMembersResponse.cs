namespace Pecus.Models.Responses.User;

/// <summary>
/// 組織メンバーアイテム（ページングレスポンスで使用）
/// </summary>
public class OrganizationMemberItem
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    public required string UserName { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// アイデンティティアイコンURL
    /// </summary>
    public string? IdentityIconUrl { get; set; }
}
