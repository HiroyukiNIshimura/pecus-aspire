using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Validation;

/// <summary>
/// 整数リストの要素数が指定範囲内かをチェックする属性
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

        var count = list.Count();

        if (count < Min || count > Max)
        {
            return new ValidationResult($"リストの要素数は {Min} から {Max} の範囲である必要があります。現在の要素数: {count}");
        }

        return ValidationResult.Success;
    }
}