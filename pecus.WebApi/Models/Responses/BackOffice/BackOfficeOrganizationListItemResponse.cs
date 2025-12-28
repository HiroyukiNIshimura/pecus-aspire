using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.BackOffice;

/// <summary>
/// BackOffice用 組織リスト項目レスポンス
/// </summary>
public class BackOfficeOrganizationListItemResponse
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

    /// <summary>
    /// 代表者名
    /// </summary>
    public string? RepresentativeName { get; set; }

    /// <summary>
    /// 電話番号
    /// </summary>
    [Required]
    public required string PhoneNumber { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// デモ組織フラグ
    /// </summary>
    public bool IsDemo { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 所属ユーザー数
    /// </summary>
    public int UserCount { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}
