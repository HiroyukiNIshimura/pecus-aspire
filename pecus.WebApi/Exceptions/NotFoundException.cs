namespace Pecus.Exceptions;

/// <summary>
/// リソースが見つからない場合の例外
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message)
        : base(message) { }

    public NotFoundException(string message, Exception innerException)
        : base(message, innerException) { }
}
