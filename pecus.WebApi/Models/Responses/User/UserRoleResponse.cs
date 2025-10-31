namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザーロール情報レスポンス
/// </summary>
public class UserRoleResponse
{
    /// <summary>
    /// ロールID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ロール名
    /// </summary>
    public required string Name { get; set; }
}