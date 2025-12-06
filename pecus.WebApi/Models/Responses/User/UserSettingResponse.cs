using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザー設定レスポンス
/// </summary>
public class UserSettingResponse
{
    /// <summary>
    /// メール受信の可否
    /// </summary>
    [Required]
    public bool CanReceiveEmail { get; set; } = true;
}