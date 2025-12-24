using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Workspace;

/// <summary>
/// ワークスペースメンバー検索リクエスト
/// </summary>
public class SearchWorkspaceMembersRequest
{
    /// <summary>
    /// 検索クエリ（2文字以上100文字以内）
    /// </summary>
    [Required(ErrorMessage = "検索クエリは必須です。")]
    [MinLength(2, ErrorMessage = "検索クエリは2文字以上で入力してください。")]
    [MaxLength(100, ErrorMessage = "検索クエリは100文字以内で入力してください。")]
    public required string Q { get; set; }

    /// <summary>
    /// 取得件数上限（1〜50、デフォルト20）
    /// </summary>
    [Range(1, 50, ErrorMessage = "取得件数は1〜50の範囲で指定してください。")]
    public int Limit { get; set; } = 20;

    /// <summary>
    /// Viewerロールを除外するかどうか（デフォルト: false）
    /// </summary>
    /// <remarks>
    /// タスクの担当者選択など、編集権限が必要な場面で true を指定します。
    /// Viewer はワークスペース内のデータを編集できないため、
    /// 担当者として設定すると矛盾が生じます。
    /// </remarks>
    public bool ExcludeViewer { get; set; } = false;
}
