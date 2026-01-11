using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// ユーザー設定
/// </summary>
public class UserSetting
{
    /// <summary>
    /// 設定ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ユーザーID（1:1）
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー
    /// </summary>
    public User? User { get; set; }

    /// <summary>
    /// メール受信の可否
    /// </summary>
    public bool CanReceiveEmail { get; set; } = true;

    /// <summary>
    /// リアルタイム通知の可否
    /// </summary>
    ///
    public bool CanReceiveRealtimeNotification { get; set; } = true;

    /// <summary>
    /// タイムゾーン（TODO：未使用）
    /// IANA zone name
    /// </summary>
    public string TimeZone { get; set; } = "Asia/Tokyo";

    /// <summary>
    /// 言語設定（TODO：未使用）
    /// </summary>
    public string Language { get; set; } = "ja-JP";

    /// <summary>
    /// ログイン後のランディングページ
    /// </summary>
    public LandingPage? LandingPage { get; set; }

    /// <summary>
    /// フォーカス推奨のスコアリング優先要素（デフォルト: Deadline）
    /// Priority: 優先度重視、Deadline: 期限重視、SuccessorImpact: 後続タスク影響重視
    /// </summary>
    public FocusScorePriority? FocusScorePriority { get; set; } = Enums.FocusScorePriority.Deadline;

    /// <summary>
    /// フォーカス推奨タスクの表示件数（5-20、デフォルト: 5）
    /// </summary>
    public int FocusTasksLimit { get; set; } = 5;

    /// <summary>
    /// 待機中タスクの表示件数（5-20、デフォルト: 5）
    /// </summary>
    public int WaitingTasksLimit { get; set; } = 5;

    /// <summary>
    /// バッジの公開範囲（nullの場合は組織設定に従う）
    /// </summary>
    public BadgeVisibility? BadgeVisibility { get; set; }

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