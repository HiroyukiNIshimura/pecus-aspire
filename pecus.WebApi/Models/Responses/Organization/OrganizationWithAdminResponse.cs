using Pecus.Models.Responses.User;

namespace Pecus.Models.Responses.Organization;

/// <summary>
/// 組織登録レスポンス（管理者ユーザー情報含む）
/// </summary>
public class OrganizationWithAdminResponse
{
    /// <summary>
    /// 組織情報
    /// </summary>
    public required OrganizationResponse Organization { get; set; }

    /// <summary>
    /// 管理者ユーザー情報
    /// </summary>
    public required UserResponse AdminUser { get; set; }
}
