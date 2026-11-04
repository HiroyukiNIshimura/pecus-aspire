using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// リカバリーコードの発行結果
/// </summary>
public class WebAuthnRecoveryCodesResponse
{
    /// <summary>
    /// 発行されたリカバリーコード（このレスポンスでのみ取得できる）
    /// </summary>
    public List<string> Codes { get; set; } = new();

    /// <summary>
    /// 保管方法の案内文（必ず別デバイスへ保存する旨）
    /// </summary>
    [Required]
    public required string Instruction { get; set; }
}
