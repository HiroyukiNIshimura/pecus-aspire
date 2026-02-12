using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Agenda;

/// <summary>
/// アジェンダ通知一覧取得リクエスト
/// </summary>
public class GetAgendaNotificationsRequest
{
    /// <summary>
    /// 取得件数（1〜100、省略時はデフォルトページサイズ）
    /// </summary>
    [Range(1, 100, ErrorMessage = "取得件数は1〜100の範囲で指定してください。")]
    public int? Limit { get; set; }

    /// <summary>
    /// このID以前の通知を取得（ページング用）
    /// </summary>
    public long? BeforeId { get; set; }

    /// <summary>
    /// 未読のみ取得
    /// </summary>
    public bool UnreadOnly { get; set; } = false;
}