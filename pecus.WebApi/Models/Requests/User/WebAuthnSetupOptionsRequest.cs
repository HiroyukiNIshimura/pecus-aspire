using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// セットアップトークン／リカバリートークンによる登録オプション取得リクエスト
/// </summary>
public class WebAuthnSetupOptionsRequest
{
    /// <summary>
    /// 招待メールに含まれるセットアップトークン
    /// </summary>
    [MaxLength(128, ErrorMessage = "トークンは128文字以内で指定してください。")]
    public string? Token { get; set; }

    /// <summary>
    /// リカバリーコードの検証で発行されたリカバリートークン
    /// </summary>
    [MaxLength(64, ErrorMessage = "リカバリートークンは64文字以内で指定してください。")]
    public string? RecoveryToken { get; set; }

    /// <summary>
    /// ログイン済みの端末で発行した端末追加チケット
    /// </summary>
    [MaxLength(64, ErrorMessage = "端末追加チケットは64文字以内で指定してください。")]
    public string? DeviceTicket { get; set; }
}
