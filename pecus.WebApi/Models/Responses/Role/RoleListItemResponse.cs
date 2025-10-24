namespace Pecus.Models.Responses.Role;

/// <summary>
/// ロールリスト項目レスポンス
/// </summary>
public class RoleListItemResponse
{
    /// <summary>
    /// ロールID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ロール名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// ロールの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// ロールが持つ権限数
    /// </summary>
    public int PermissionCount { get; set; }
}
