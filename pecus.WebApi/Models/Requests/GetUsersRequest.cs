using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

public class GetUsersRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "ページサイズは1〜100の範囲で指定してください。")]
    public int PageSize { get; set; } = 10;

    /// <summary>
    /// アクティブなユーザーのみ取得するか（null: 全て、true: アクティブのみ、false: 非アクティブのみ）
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// ユーザー名による前方一致検索（オプション）
    /// </summary>
    [StringLength(100, ErrorMessage = "ユーザー名は100文字以内で指定してください。")]
    public string? Username { get; set; }

    /// <summary>
    /// スキルIDで絞り込み（指定されたスキルを持つユーザーのみを検索）
    /// </summary>
    [MaxLength(10, ErrorMessage = "スキルIDは最大10個までです。")]
    public List<int>? SkillIds { get; set; }
}