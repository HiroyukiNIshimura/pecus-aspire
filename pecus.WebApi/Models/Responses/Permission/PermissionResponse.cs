namespace Pecus.Models.Responses.Permission;

/// <summary>
/// 権限情報レスポンス
/// </summary>
public class PermissionResponse
{
    /// <summary>
    /// 権限ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 権限名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// 権限の説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 権限カテゴリ
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
