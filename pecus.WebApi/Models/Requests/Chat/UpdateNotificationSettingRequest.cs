using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Chat;

/// <summary>
/// 通知設定更新リクエスト
/// </summary>
public class UpdateNotificationSettingRequest
{
    /// <summary>
    /// 通知設定
    /// </summary>
    [Required(ErrorMessage = "通知設定は必須です。")]
    public required ChatNotificationSetting Setting { get; set; }
}