namespace Pecus.Models.Responses.External;

/// <summary>
/// Pingレスポンス
/// </summary>
public class PingResponse
{
    /// <summary>
    /// エコーバックされたメッセージ
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// 認証されたAPIキーの組織コード
    /// </summary>
    public required string OrganizationCode { get; set; }

    /// <summary>
    /// サーバー応答時刻（UTC）
    /// </summary>
    public required DateTimeOffset Timestamp { get; set; }
}