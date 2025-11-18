using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Validation;

/// <summary>
/// 整数リストの各要素に対して範囲チェックを行う属性
/// </summary>
public class IntListRangeAttribute : ValidationAttribute
{
    public int Min { get; }
    public int Max { get; }

    public IntListRangeAttribute(int min, int max)
    {
        Min = min;
        Max = max;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null)
        {
            return ValidationResult.Success;
        }

        if (value is not IEnumerable<int> list)
        {
            return new ValidationResult("IntListRangeAttribute は int の列挙にのみ適用できます。");
        }

        var index = 0;
        foreach (var item in list)
        {
            if (item < Min || item > Max)
            {
                return new ValidationResult($"リストの要素は {Min} から {Max} の範囲である必要があります。インデックス: {index}");
            }
            index++;
        }

        return ValidationResult.Success;
    }
}