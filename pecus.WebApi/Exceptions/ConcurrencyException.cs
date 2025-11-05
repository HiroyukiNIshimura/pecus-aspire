namespace Pecus.Exceptions;

/// <summary>
/// DB競合エラー（楽観的ロック）
/// </summary>
public class ConcurrencyException : Exception
{
    public ConcurrencyException(string message)
        : base(message) { }
}
