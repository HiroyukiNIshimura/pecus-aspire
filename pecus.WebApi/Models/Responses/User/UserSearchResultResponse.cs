using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザー検索結果レスポンス
/// </summary>
/// <remarks>
/// ワークスペースへのメンバー追加時など、ユーザー検索結果を表示するための
/// 軽量なレスポンスモデルです。
/// </remarks>
public class UserSearchResultResponse
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    public required string Username { get; set; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// アバタータイプ
    /// </summary>
    public AvatarType? AvatarType { get; set; }

    /// <summary>
    /// アイデンティティアイコンURL
    /// </summary>
    public string? IdentityIconUrl { get; set; }
}
