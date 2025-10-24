namespace Pecus.Models.Responses.Common;

/// <summary>
/// 内部サーバーエラーレスポンス（詳細なメッセージを含まない）
/// </summary>
public class InternalServerErrorResponse
{
    /// <summary>
    /// HTTPステータスコード
    /// </summary>
    public int StatusCode { get; set; } = 500;

    /// <summary>
    /// エラーメッセージ（一般的なメッセージのみ）
    /// </summary>
    public string Message { get; set; } = "内部サーバーエラーが発生しました。";
}
