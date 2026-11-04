namespace Pecus.Models.Responses.User;

/// <summary>
/// 認証器の選択条件
/// </summary>
public class WebAuthnAuthenticatorSelection
{
    /// <summary>
    /// 認証器の接続方式（未指定で幅広く許可）
    /// </summary>
    public string? AuthenticatorAttachment { get; set; }

    /// <summary>
    /// discoverable credentials の要求レベル
    /// </summary>
    public string? ResidentKey { get; set; }

    /// <summary>
    /// ユーザー検証の要求レベル
    /// </summary>
    public string? UserVerification { get; set; }
}
