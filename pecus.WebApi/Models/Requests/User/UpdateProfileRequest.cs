using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Validation;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// プロフィール更新リクエスト
/// </summary>
public class UpdateProfileRequest
{
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public string? Username { get; set; }

    [EnumDataType(typeof(AvatarType), ErrorMessage = "有効なアバタータイプを指定してください。")]
    public AvatarType? AvatarType { get; set; }

    [MaxLength(200, ErrorMessage = "ユーザーアバターパスは200文字以内で入力してください。")]
    public string? UserAvatarPath { get; set; }

    [IntListRange(0, 50)]
    public List<int>? SkillIds { get; set; }

    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}