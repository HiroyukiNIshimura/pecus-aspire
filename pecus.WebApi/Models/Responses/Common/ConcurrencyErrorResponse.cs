namespace Pecus.Models.Responses.Common;

/// <summary>
/// 競合エラーレスポンス（409 Conflict）
/// </summary>
public class ConcurrencyErrorResponse<T> : ErrorResponse where T : IConflictModel
{
    /// <summary>
    /// DBの最新データ
    /// </summary>
    public T? Current { get; set; }
}