using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.External;

/// <summary>
/// Pingリクエスト（疎通確認用）
/// </summary>
public class PingRequest
{
    /// <summary>
    /// エコーバックする文字列
    /// </summary>
    [Required(ErrorMessage = "メッセージは必須です。")]
    [MaxLength(500, ErrorMessage = "メッセージは500文字以内で入力してください。")]
    public required string Message { get; set; }
}
