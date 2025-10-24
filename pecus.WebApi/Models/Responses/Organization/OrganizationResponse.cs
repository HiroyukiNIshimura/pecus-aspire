namespace Pecus.Models.Responses.Organization;

/// <summary>
/// 組織情報レスポンス
/// </summary>
public class OrganizationResponse
{
    /// <summary>
    /// 組織ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 組織名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// 組織コード
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// 組織の説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 代表者名
    /// </summary>
    public string? RepresentativeName { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    public required string PhoneNumber { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
