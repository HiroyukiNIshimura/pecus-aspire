using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ロール作成リクエスト
/// </summary>
public class CreateRoleRequest
{
    /// <summary>
    /// ロール名
    /// </summary>
    [Required(ErrorMessage = "ロール名は必須です。")]
    [MaxLength(50, ErrorMessage = "ロール名は50文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// ロールの説明
    /// </summary>
    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }
}

/// <summary>
/// ロール更新リクエスト
/// </summary>
public class UpdateRoleRequest
{
    /// <summary>
    /// ロール名
    /// </summary>
    [MaxLength(50, ErrorMessage = "ロール名は50文字以内で入力してください。")]
    public string? Name { get; set; }

    /// <summary>
    /// ロールの説明
    /// </summary>
    [MaxLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }

    /// <summary>
    /// ロールの楽観的ロック用のRowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }

}

/// <summary>
/// ロールに権限を設定するリクエスト
/// </summary>
public class SetPermissionsToRoleRequest
{
    /// <summary>
    /// 設定する権限IDのリスト。既存の権限をすべて置き換えます。
    /// 空のリストまたはnullを指定するとすべての権限が削除されます。
    /// </summary>
    [Validation.IntListRange(0, 200)]
    public List<int>? PermissionIds { get; set; }
}

