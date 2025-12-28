using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.BackOffice;

/// <summary>
/// BackOffice用 組織削除リクエスト
/// </summary>
public class BackOfficeDeleteOrganizationRequest
{
    /// <summary>
    /// 確認用組織名（誤操作防止）
    /// </summary>
    [Required(ErrorMessage = "確認用の組織名を入力してください。")]
    [MaxLength(100, ErrorMessage = "組織名は100文字以内で入力してください。")]
    public required string ConfirmOrganizationName { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
