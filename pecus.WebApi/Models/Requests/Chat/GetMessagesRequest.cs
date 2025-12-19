using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Chat;

/// <summary>
/// メッセージ取得リクエスト（クエリパラメータ）
/// </summary>
public class GetMessagesRequest
{
    /// <summary>
    /// 取得件数（デフォルト: 50、最大: 100）
    /// </summary>
    [Range(1, 100, ErrorMessage = "取得件数は1〜100の範囲で指定してください。")]
    public int Limit { get; set; } = 50;

    /// <summary>
    /// カーソル（このメッセージIDより前のメッセージを取得）
    /// </summary>
    public int? Cursor { get; set; }
}
