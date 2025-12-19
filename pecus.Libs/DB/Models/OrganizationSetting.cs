using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// 組織の設定を管理するエンティティ
/// </summary>
public class OrganizationSetting
{
    /// <summary>
    /// 設定ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 組織ID（1:1）
    /// </summary>
    public int OrganizationId { get; set; }

    /// <summary>
    /// 組織
    /// </summary>
    public Organization? Organization { get; set; }

    /// <summary>
    /// タスク超過チェックの閾値（日数）
    /// </summary>
    public int TaskOverdueThreshold { get; set; } = 0;

    /// <summary>
    /// 週間レポートの配信曜日（0=未設定/日曜起点などクライアント定義）
    /// </summary>
    public int WeeklyReportDeliveryDay { get; set; } = 0;

    /// <summary>
    /// メール配信元のメールアドレス
    /// </summary>
    public string? MailFromAddress { get; set; }

    /// <summary>
    /// メール配信元のFrom（表示名）
    /// </summary>
    public string? MailFromName { get; set; }

    /// <summary>
    /// 利用する生成APIのベンダー種類
    /// </summary>
    public GenerativeApiVendor GenerativeApiVendor { get; set; } = GenerativeApiVendor.None;

    /// <summary>
    /// 生成APIのAPIキー
    /// </summary>
    public string? GenerativeApiKey { get; set; }

    /// <summary>
    /// 利用プラン
    /// </summary>
    public OrganizationPlan Plan { get; set; } = OrganizationPlan.Free;

    /// <summary>
    /// ヘルプコメント通知の送信先
    /// </summary>
    public HelpNotificationTarget? HelpNotificationTarget { get; set; }

    /// <summary>
    /// タスク作成時に見積もりを必須とするか
    /// </summary>
    public bool RequireEstimateOnTaskCreation { get; set; } = false;

    /// <summary>
    /// 先行タスクが完了しないと次のタスクを操作できないようにするか
    /// </summary>
    public bool EnforcePredecessorCompletion { get; set; } = false;

    /// <summary>
    /// ダッシュボードに表示するヘルプコメントの最大件数（5〜20）
    /// </summary>
    public int DashboardHelpCommentMaxCount { get; set; } = 6;

    /// <summary>
    /// グループチャットのスコープ設定
    /// Workspace: ワークスペース単位（デフォルト）
    /// Organization: 組織全体で1つのグループチャット
    /// </summary>
    public GroupChatScope? GroupChatScope { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号
    /// </summary>
    public uint RowVersion { get; set; }
}