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

    /// <summary>
    /// 現在有効な（未使用の）リカバリーコード数
    /// </summary>
    /// <remarks>
    /// リカバリーで復旧した際に残りのコードを使い続けられる場合、新しいコードは発行されない。
    /// その場合はこの値に残数が入る（発行した場合は発行数）。
    /// </remarks>
    public int? UnusedRecoveryCodeCount { get; set; }
}
