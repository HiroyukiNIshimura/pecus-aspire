namespace Pecus.Exceptions;

/// <summary>
/// 認証失敗時の例外（401 Unauthorized）
/// </summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message) { }
}