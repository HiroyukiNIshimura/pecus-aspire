namespace Pecus.Exceptions;

/// <summary>
/// 競合例外のインターフェース
/// GlobalExceptionFilterでリフレクションを使わずに型安全に処理するためのインターフェース
/// </summary>
public interface IConcurrencyException
{
    /// <summary>
    /// エラーメッセージ
    /// </summary>
    string Message { get; }

    /// <summary>
    /// 競合したモデル（最新のDBの値）
    /// </summary>
    object? ConflictedModel { get; }
}
