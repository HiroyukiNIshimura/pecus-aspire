namespace Pecus.Models.Responses.User;

/// <summary>
/// ユーザースキル情報レスポンス
/// </summary>
public class UserSkillResponse
{
    /// <summary>
 /// スキルID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// スキル名
    /// </summary>
    public required string Name { get; set; }
}