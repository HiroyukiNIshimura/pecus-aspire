using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Organization;

/// <summary>
/// 組織設定更新リクエスト（管理者用）
/// </summary>
public class AdminUpdateOrganizationSettingRequest
{
    /// <summary>
    /// タスク超過チェックの閾値（日数）。0で未設定。
    /// </summary>
    [Range(0, 365, ErrorMessage = "タスク超過閾値は0〜365の範囲で指定してください。")]
    public int TaskOverdueThreshold { get; set; }

    /// <summary>
    /// 週間レポートの配信曜日（0=未設定 / 1=日曜〜7=土曜を想定）
    /// </summary>
    [Range(0, 7, ErrorMessage = "週間レポート配信曜日は0〜7の範囲で指定してください。")]
    public int WeeklyReportDeliveryDay { get; set; }

    /// <summary>
    /// メール配信元アドレス
    /// </summary>
    [EmailAddress(ErrorMessage = "有効なメールアドレス形式で入力してください。")]
    [MaxLength(254, ErrorMessage = "メールアドレスは254文字以内で入力してください。")]
    public string? MailFromAddress { get; set; }

    /// <summary>
    /// メール配信元名
    /// </summary>
    [MaxLength(100, ErrorMessage = "メール配信元名は100文字以内で入力してください。")]
    public string? MailFromName { get; set; }

    /// <summary>
    /// 利用する生成APIベンダー
    /// GenerativeApiVendor.Noneの場合、生成APIは利用しない。
    /// </summary>
    [Required(ErrorMessage = "生成APIベンダーは必須です。")]
    public required GenerativeApiVendor GenerativeApiVendor { get; set; }

    /// <summary>
    /// 生成APIキー
    /// </summary>
    [MaxLength(512, ErrorMessage = "生成APIキーは512文字以内で入力してください。")]
    public string? GenerativeApiKey { get; set; }

    /// <summary>
    /// 利用プラン
    /// </summary>
    [Required(ErrorMessage = "プランは必須です。")]
    public required OrganizationPlan Plan { get; set; }

    /// <summary>
    /// ヘルプコメント通知の送信先
    /// </summary>
    public HelpNotificationTarget? HelpNotificationTarget { get; set; }

    /// <summary>
    /// 楽観的ロック用RowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
