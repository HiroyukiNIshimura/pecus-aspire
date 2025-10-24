namespace Pecus.Models.Responses.Common;

/// <summary>
/// エラーレスポンス
/// </summary>
public class ErrorResponse
{
    /// <summary>
    /// HTTPステータスコード
    /// </summary>
    public int StatusCode { get; set; }

    /// <summary>
    /// エラーメッセージ
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// エラー詳細（オプション）
    /// </summary>
    public string? Details { get; set; }
}
