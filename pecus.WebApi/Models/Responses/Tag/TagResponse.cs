namespace Pecus.Models.Responses.Tag;

/// <summary>
/// タグレスポンス
/// </summary>
public class TagResponse
{
    /// <summary>
    /// 成功フラグ
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// メッセージ
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// タグ情報
    /// </summary>
    public TagDetailResponse? Tag { get; set; }
}
