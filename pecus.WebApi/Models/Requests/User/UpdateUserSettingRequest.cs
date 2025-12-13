using System.ComponentModel.DataAnnotations;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Models.Requests.User;

/// <summary>
/// 自ユーザー設定の更新リクエスト
/// </summary>
public class UpdateUserSettingRequest
{
    /// <summary>
    /// メールを受信するかどうか
    /// </summary>
    [Required(ErrorMessage = "メール受信設定は必須です。")]
    public required bool CanReceiveEmail { get; set; }

    /// <summary>
    /// リアルタイム通知の可否
    /// </summary>
    ///
    [Required(ErrorMessage = "リアルタイム通知の可否は必須です。")]
    public required bool CanReceiveRealtimeNotification { get; set; }

    /// <summary>
    /// タイムゾーン（TODO：未使用）
    /// IANA zone name
    /// </summary>
    [Required(ErrorMessage = "タイムゾーンは必須です。")]
    public required string TimeZone { get; set; } = "Asia/Tokyo";

    /// <summary>
    /// 言語設定（TODO：未使用）
    /// </summary>
    [Required(ErrorMessage = "言語設定は必須です。")]
    public required string Language { get; set; } = "ja-JP";

    /// <summary>
    /// ログイン後のランディングページ
    /// </summary>
    public LandingPage? LandingPage { get; set; }

    /// <summary>
    /// ユーザー設定の楽観的ロック用 RowVersion
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}