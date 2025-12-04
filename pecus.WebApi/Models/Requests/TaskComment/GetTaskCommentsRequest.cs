using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.TaskComment;

/// <summary>
/// タスクコメント一覧取得リクエスト
/// </summary>
public class GetTaskCommentsRequest
{
    /// <summary>
    /// ページ番号（1から始まる）
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// 1ページあたりの件数（1〜100、デフォルト20）
    /// </summary>
    [Range(1, 100, ErrorMessage = "ページサイズは1〜100の範囲で指定してください。")]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// コメントタイプでフィルタ
    /// </summary>
    public TaskCommentType? CommentType { get; set; }

    /// <summary>
    /// 削除されたコメントも含める（デフォルトはfalse）
    /// </summary>
    public bool IncludeDeleted { get; set; } = false;
}
