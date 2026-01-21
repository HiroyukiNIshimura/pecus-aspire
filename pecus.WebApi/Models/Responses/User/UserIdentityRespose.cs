using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

public class UserIdentityResponse
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    [Required]
    public int Id { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    [Required]
    public string? Username { get; set; }

    /// <summary>
    /// アイデンティティアイコンURL（表示用）
    /// 必ず有効なURLが返されるため、クライアント側でnullチェック不要
    /// </summary>
    [Required]
    public string? IdentityIconUrl { get; set; }

    /// <summary>
    /// ユーザーがアクティブかどうか
    /// </summary>
    [Required]
    public bool IsActive { get; set; }
}