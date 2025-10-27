using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

public class GetUsersRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int? Page { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "ページサイズは1〜100の範囲で指定してください。")]
    public int PageSize { get; set; } = 10;

    public bool? ActiveOnly { get; set; }
}