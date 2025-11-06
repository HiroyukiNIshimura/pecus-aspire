namespace Pecus.Exceptions;

/// <summary>
/// DB競合エラー（楽観的ロック）
/// </summary>
public class ConcurrencyException<T> : Exception
    where T : class
{
    /// <summary>
    /// 競合したモデル（最新のDBの値）
    /// </summary>
    /// <value></value>
    public T? ConflictedModel { get; }

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="message"></param>
    /// <param name="conflictedModel"></param>
    public ConcurrencyException(string message, T? conflictedModel)
        : base(message)
    {
        ConflictedModel = conflictedModel;
    }
}
