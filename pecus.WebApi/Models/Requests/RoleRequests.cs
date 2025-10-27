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
    [StringLength(50, ErrorMessage = "ロール名は50文字以内で入力してください。")]
    public required string Name { get; set; }

    /// <summary>
    /// ロールの説明
    /// </summary>
    [StringLength(200, ErrorMessage = "説明は200文字以内で入力してください。")]
    public string? Description { get; set; }
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
    public List<int>? PermissionIds { get; set; }
}
