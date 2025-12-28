using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.BackOffice;

/// <summary>
/// BackOffice用 組織一覧取得リクエスト
/// </summary>
public class BackOfficeGetOrganizationsRequest
{
    /// <summary>
    /// ページ番号
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// ページサイズ
    /// </summary>
    [Range(1, 100, ErrorMessage = "ページサイズは1〜100で指定してください。")]
    public int PageSize { get; set; } = 20;
}
