namespace Pecus.Models.Responses.Common;

/// <summary>
/// リフレッシュレスポンス
/// </summary>
public class RefreshResponse
{
    /// <summary>
    /// JWTアクセストークン
    /// </summary>
    public required string AccessToken { get; set; }

    /// <summary>
    /// トークンタイプ（常に "Bearer"）
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// トークンの有効期限（UTC）
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// トークンの有効時間（秒）
    /// </summary>
    public int ExpiresIn { get; set; }

    /// <summary>
    /// リフレッシュトークン
    /// </summary>
    public required string RefreshToken { get; set; }

    /// <summary>
    /// リフレッシュトークンの有効期限（UTC）
    /// </summary>
    public DateTime RefreshExpiresAt { get; set; }
}