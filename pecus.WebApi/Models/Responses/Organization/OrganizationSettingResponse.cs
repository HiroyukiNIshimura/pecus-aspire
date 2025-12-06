using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Organization;

/// <summary>
/// 組織設定レスポンス
/// </summary>
public class OrganizationSettingResponse
{
    /// <summary>
    /// タスク超過チェックの閾値（日数）
    /// </summary>
    [Required]
    public int TaskOverdueThreshold { get; set; }

    /// <summary>
    /// 週間レポートの配信曜日（0=未設定/日曜起点などクライアント定義）
    /// </summary>
    [Required]
    public int WeeklyReportDeliveryDay { get; set; }

    /// <summary>
    /// メール配信元のメールアドレス
    /// </summary>
    [EmailAddress]
    [MaxLength(254)]
    public string? MailFromAddress { get; set; }

    /// <summary>
    /// メール配信元のFrom（表示名）
    /// </summary>
    [MaxLength(100)]
    public string? MailFromName { get; set; }

    /// <summary>
    /// 利用する生成APIのベンダー種類
    /// </summary>
    [Required]
    public GenerativeApiVendor GenerativeApiVendor { get; set; }

    /// <summary>
    /// 利用プラン
    /// </summary>
    [Required]
    public OrganizationPlan Plan { get; set; }

    /// <summary>
    /// 楽観的ロック用RowVersion
    /// </summary>
    [Required]
    public uint RowVersion { get; set; }
}