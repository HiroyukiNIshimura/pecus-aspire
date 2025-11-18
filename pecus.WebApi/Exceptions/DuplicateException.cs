namespace Pecus.Exceptions;

/// <summary>
/// 重複データが存在する場合の例外
/// </summary>
public class DuplicateException : Exception
{
    public DuplicateException(string message)
        : base(message) { }

    public DuplicateException(string message, Exception innerException)
        : base(message, innerException) { }
}