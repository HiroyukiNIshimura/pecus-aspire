namespace Pecus.Models.Requests;

/// <summary>
/// リフレッシュトークン交換 / ログアウト用リクエスト
/// </summary>
public class RefreshRequest
{
    /// <summary>
    /// クライアントから送られるリフレッシュトークン
    /// </summary>
    public string? RefreshToken { get; set; }
}
