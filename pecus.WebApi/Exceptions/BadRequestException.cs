namespace Pecus.Exceptions;

/// <summary>
/// 不正なリクエストの場合の例外
/// </summary>
public class BadRequestException : Exception
{
    public BadRequestException(string message)
        : base(message) { }

    public BadRequestException(string message, Exception innerException)
        : base(message, innerException) { }
}