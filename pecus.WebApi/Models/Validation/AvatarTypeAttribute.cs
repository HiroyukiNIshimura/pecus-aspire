using System.ComponentModel.DataAnnotations;
using Pecus.Libs;

namespace Pecus.Models.Validation;

/// <summary>
/// アバタータイプのバリデーション属性
/// </summary>
public class AvatarTypeAttribute : ValidationAttribute
{
    private static readonly string[] ValidTypes = { "gravatar", "user-avatar", "auto-generated" };

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null)
        {
            return ValidationResult.Success;
        }

        var avatarType = value.ToString();

        if (string.IsNullOrWhiteSpace(avatarType))
        {
            return ValidationResult.Success;
        }

        if (!IdentityIconHelper.IsValidIconType(avatarType))
        {
            return new ValidationResult(
                $"アバタータイプは次のいずれかである必要があります: {string.Join(", ", ValidTypes)}"
            );
        }

        return ValidationResult.Success;
    }
}
