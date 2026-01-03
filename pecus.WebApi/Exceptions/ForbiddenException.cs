namespace Pecus.Exceptions;

/// <summary>
/// 権限不足の場合の例外（403 Forbidden）
/// Viewer権限のユーザーが変更操作を試みた場合などに使用
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message)
        : base(message) { }

    public ForbiddenException(string message, Exception innerException)
        : base(message, innerException) { }
}