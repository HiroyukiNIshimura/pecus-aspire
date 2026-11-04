namespace Pecus.Models.Responses.User;

/// <summary>
/// サポートする公開鍵アルゴリズム
/// </summary>
public class WebAuthnCredentialParameter
{
    /// <summary>
    /// クレデンシャル種別
    /// </summary>
    public string Type { get; set; } = "public-key";

    /// <summary>
    /// COSE アルゴリズム識別子
    /// </summary>
    public int Alg { get; set; }
}
