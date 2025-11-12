namespace Pecus.Exceptions;

/// <summary>
/// DB競合エラー（楽観的ロック）
/// </summary>
public class ConcurrencyException<T> : Exception, IConcurrencyException
    where T : IConflictModel
{
    /// <summary>
    /// 競合したモデル（最新のDBの値）
    /// </summary>
    /// <value></value>
    public T? ConflictedModel { get; }

    /// <summary>
    /// IConcurrencyException インターフェース実装（object型で公開）
    /// </summary>
    object? IConcurrencyException.ConflictedModel => ConflictedModel;

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
