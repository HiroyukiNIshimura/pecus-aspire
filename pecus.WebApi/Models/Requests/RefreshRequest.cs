using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// リフレッシュトークン交換 / ログアウト用リクエスト
/// </summary>
public class RefreshRequest
{
    /// <summary>
    /// クライアントから送られるリフレッシュトークン
    /// </summary>
    [Required(ErrorMessage = "リフレッシュトークンは必須です。")]
    [MaxLength(512, ErrorMessage = "リフレッシュトークンは512文字以内で指定してください。")]
    public required string RefreshToken { get; set; }
}

