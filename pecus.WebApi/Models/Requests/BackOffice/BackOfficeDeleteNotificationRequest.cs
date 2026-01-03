using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.BackOffice;

/// <summary>
/// BackOffice用 システム通知削除リクエスト
/// </summary>
public class BackOfficeDeleteNotificationRequest
{
    /// <summary>
    /// 配信済みメッセージも削除するか
    /// </summary>
    public bool DeleteMessages { get; set; } = true;

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}