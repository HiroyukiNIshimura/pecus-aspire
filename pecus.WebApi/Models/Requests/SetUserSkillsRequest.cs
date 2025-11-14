using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ユーザーのスキル設定リクエスト
/// </summary>
public class SetUserSkillsRequest
{
    [Required(ErrorMessage = "スキルIDのリストは必須です。")]
    public required List<int> SkillIds { get; set; }

    public uint? UserRowVersion { get; set; }
}
