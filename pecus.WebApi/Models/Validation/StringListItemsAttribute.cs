using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Validation;

/// <summary>
/// 文字列リストの各要素に対して非空・最大長チェックを行う属性
/// </summary>
public class StringListItemsAttribute : ValidationAttribute
{
    public int MaxLength { get; }

    public StringListItemsAttribute(int maxLength)
    {
        MaxLength = maxLength;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null)
        {
            return ValidationResult.Success;
        }

        if (value is not IEnumerable<string> list)
        {
            return new ValidationResult("StringListItemsAttribute は string の列挙にのみ適用できます。");
        }

        var index = 0;
        foreach (var item in list)
        {
            if (string.IsNullOrWhiteSpace(item))
            {
                return new ValidationResult($"リストの要素は空であってはなりません。インデックス: {index}");
            }

            if (item.Length > MaxLength)
            {
                return new ValidationResult($"リストの要素は最大 {MaxLength} 文字までです。インデックス: {index}");
            }

            index++;
        }

        return ValidationResult.Success;
    }
}