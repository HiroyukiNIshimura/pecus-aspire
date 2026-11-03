namespace Pecus.Exceptions;

/// <summary>
/// 試行回数超過時の例外（429 Too Many Requests）
/// </summary>
public class TooManyRequestsException : Exception
{
    public TooManyRequestsException(string message) : base(message) { }
}
