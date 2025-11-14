using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ユーザー更新リクエスト
/// </summary>
public class UpdateUserRequest
{
    [Required(ErrorMessage = "ユーザー名は必須です。")]
    [MaxLength(50, ErrorMessage = "ユーザー名は50文字以内で入力してください。")]
    public required string Username { get; set; }

    [Required(ErrorMessage = "アバタータイプは必須です。")]
    [EnumDataType(typeof(AvatarType), ErrorMessage = "有効なアバタータイプを指定してください。")]
    public required AvatarType AvatarType { get; set; }

    [MaxLength(200, ErrorMessage = "ユーザーアバターパスは200文字以内で入力してください。")]
    public string? UserAvatarPath { get; set; }

    public bool? IsActive { get; set; }
}
