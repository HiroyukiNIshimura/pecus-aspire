using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// セットアップトークン／リカバリーコードによる登録結果
/// </summary>
public class WebAuthnSetupRegistrationResponse
{
    /// <summary>
    /// 登録されたパスキー
    /// </summary>
    [Required]
    public required WebAuthnCredentialResponse Credential { get; set; }

    /// <summary>
    /// 発行されたリカバリーコード（未発行の場合は null）
    /// </summary>
    public List<string>? RecoveryCodes { get; set; }

    /// <summary>
    /// リカバリーコードの保管方法の案内文
    /// </summary>
    public string? RecoveryCodeInstruction { get; set; }

    /// <summary>
    /// リカバリー経路のため全セッションを失効させたか
    /// </summary>
    public bool SessionsRevoked { get; set; }
}
