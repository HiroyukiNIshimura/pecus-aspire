using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Organization;

/// <summary>
/// 組織設定レスポンス
/// </summary>
public class OrganizationSettingResponse : IConflictModel
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
    /// 生成APIキー
    /// </summary>
    public string? GenerativeApiKey { get; set; }

    /// <summary>
    /// 利用する生成AIモデル（例: gpt-4o, gemini-1.5-pro）
    /// </summary>
    public string? GenerativeApiModel { get; set; }

    /// <summary>
    /// 利用プラン
    /// </summary>
    [Required]
    public OrganizationPlan Plan { get; set; }

    /// <summary>
    /// ヘルプコメント通知の送信先
    /// </summary>
    public HelpNotificationTarget? HelpNotificationTarget { get; set; }

    /// <summary>
    /// タスク作成時に見積もりを必須とするか
    /// </summary>
    [Required]
    public bool RequireEstimateOnTaskCreation { get; set; }

    /// <summary>
    /// 先行タスクが完了しないと次のタスクを操作できないようにするか
    /// </summary>
    [Required]
    public bool EnforcePredecessorCompletion { get; set; }

    /// <summary>
    /// ダッシュボードに表示するヘルプコメントの最大件数（5〜20）
    /// </summary>
    [Required]
    public int DashboardHelpCommentMaxCount { get; set; }

    /// <summary>
    /// グループチャットのスコープ設定
    /// Workspace: ワークスペース単位（デフォルト）
    /// Organization: 組織全体で1つのグループチャット
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<GroupChatScope>))]
    public GroupChatScope? GroupChatScope { get; set; }

    /// <summary>
    /// 楽観的ロック用RowVersion
    /// </summary>
    [Required]
    public uint RowVersion { get; set; }
}