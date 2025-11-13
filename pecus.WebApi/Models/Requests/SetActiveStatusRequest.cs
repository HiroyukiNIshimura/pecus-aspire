namespace Pecus.Models.Requests;

/// <summary>
/// アクティブ状態設定リクエスト（レガシー用）
/// </summary>
public class SetActiveStatusRequest
{
    /// <summary>
    /// アクティブ状態（true: 有効, false: 無効）
    /// </summary>
    public required bool IsActive { get; set; }
}
