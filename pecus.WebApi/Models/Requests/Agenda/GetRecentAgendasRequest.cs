using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Agenda;

/// <summary>
/// 直近アジェンダ一覧取得リクエスト
/// </summary>
public class GetRecentAgendasRequest
{
    /// <summary>
    /// 取得件数（1〜100、省略時はデフォルトページサイズ）
    /// </summary>
    [Range(1, 100, ErrorMessage = "取得件数は1〜100の範囲で指定してください。")]
    public int? Limit { get; set; }
}
