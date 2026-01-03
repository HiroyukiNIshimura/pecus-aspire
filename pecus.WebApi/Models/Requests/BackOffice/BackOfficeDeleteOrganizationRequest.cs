using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.BackOffice;

/// <summary>
/// BackOffice用 組織削除リクエスト
/// </summary>
public class BackOfficeDeleteOrganizationRequest
{
    /// <summary>
    /// 確認用組織コード（誤操作防止）
    /// </summary>
    [Required(ErrorMessage = "確認用の組織コードを入力してください。")]
    [MaxLength(50, ErrorMessage = "組織コードは50文字以内で入力してください。")]
    public required string ConfirmOrganizationCode { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}