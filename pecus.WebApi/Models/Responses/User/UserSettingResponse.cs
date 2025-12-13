using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

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
    /// ユーザー設定の楽観的ロック用 RowVersion
    /// </summary>
    public uint RowVersion { get; set; }
}