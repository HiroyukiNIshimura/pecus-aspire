using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザー設定レスポンス
/// </summary>
public class UserSettingResponse : IConflictModel
{
    /// <summary>
    /// メール受信の可否
    /// </summary>
    [Required]
    public bool CanReceiveEmail { get; set; } = true;

    /// <summary>
    /// リアルタイム通知の可否
    /// </summary>
    ///
    [Required]
    public bool CanReceiveRealtimeNotification { get; set; } = true;

    /// <summary>
    /// タイムゾーン（TODO：未使用）
    /// IANA zone name
    /// </summary>
    [Required]
    public string TimeZone { get; set; } = "Asia/Tokyo";

    /// <summary>
    /// 言語設定（TODO：未使用）
    /// </summary>
    [Required]
    public string Language { get; set; } = "ja-JP";

    /// <summary>
    /// ログイン後のランディングページ
    /// </summary>
    public LandingPage? LandingPage { get; set; }

    /// <summary>
    /// フォーカス推奨のスコアリング優先要素
    /// Priority: 優先度重視、Deadline: 期限重視、SuccessorImpact: 後続タスク影響重視
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<FocusScorePriority>))]
    public FocusScorePriority? FocusScorePriority { get; set; }

    /// <summary>
    /// フォーカス推奨タスクの表示件数（5-20）
    /// </summary>
    [Required]
    [Range(5, 20, ErrorMessage = "フォーカスタスク表示件数は5〜20の範囲で指定してください。")]
    public int FocusTasksLimit { get; set; } = 5;

    /// <summary>
    /// 待機中タスクの表示件数（5-20）
    /// </summary>
    [Required]
    [Range(5, 20, ErrorMessage = "待機中タスク表示件数は5〜20の範囲で指定してください。")]
    public int WaitingTasksLimit { get; set; } = 5;

    /// <summary>
    /// ユーザー設定の楽観的ロック用 RowVersion
    /// </summary>
    public uint RowVersion { get; set; }
}