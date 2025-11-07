using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Organization;

/// <summary>
/// 組織情報レスポンス（簡易版）
/// </summary>
public class OrganizationInfoResponse
{
    /// <summary>
    /// 組織ID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// 組織名
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// 組織コード
    /// </summary>
    public string? Code { get; set; }
}
