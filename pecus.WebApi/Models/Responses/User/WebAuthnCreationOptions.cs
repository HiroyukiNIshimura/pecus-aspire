using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// PublicKeyCredentialCreationOptions（パスキー登録）
/// </summary>
public class WebAuthnCreationOptions
{
    /// <summary>
    /// Relying Party 情報
    /// </summary>
    [Required]
    public required WebAuthnRpEntity Rp { get; set; }

    /// <summary>
    /// ユーザー情報
    /// </summary>
    [Required]
    public required WebAuthnUserEntity User { get; set; }

    /// <summary>
    /// チャレンジ（base64url）
    /// </summary>
    [Required]
    public required string Challenge { get; set; }

    /// <summary>
    /// サポートする公開鍵アルゴリズム
    /// </summary>
    public List<WebAuthnCredentialParameter> PubKeyCredParams { get; set; } = new();

    /// <summary>
    /// タイムアウト（ミリ秒）
    /// </summary>
    public long Timeout { get; set; }

    /// <summary>
    /// アテステーションの要求方式
    /// </summary>
    public string? Attestation { get; set; }

    /// <summary>
    /// 認証器の選択条件
    /// </summary>
    public WebAuthnAuthenticatorSelection? AuthenticatorSelection { get; set; }

    /// <summary>
    /// 登録済みクレデンシャル（重複登録の防止）
    /// </summary>
    public List<WebAuthnCredentialDescriptor> ExcludeCredentials { get; set; } = new();
}
