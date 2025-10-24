namespace Pecus.Models.Responses.Common;

/// <summary>
/// 成功メッセージレスポンス
/// </summary>
public class SuccessResponse
{
    /// <summary>
    /// HTTPステータスコード
    /// </summary>
    public int StatusCode { get; set; }

    /// <summary>
    /// 成功メッセージ
    /// </summary>
    public required string Message { get; set; }
}
