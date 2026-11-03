namespace Pecus.Models.Responses.User;

/// <summary>
/// リカバリーコードの保持状況
/// </summary>
public class WebAuthnRecoveryCodeStatusResponse
{
    /// <summary>
    /// 未使用のリカバリーコードを保持しているか
    /// </summary>
    public bool HasUnusedCodes { get; set; }
}
