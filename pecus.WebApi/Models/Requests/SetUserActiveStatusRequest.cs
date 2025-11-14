namespace Pecus.Models.Requests;

/// <summary>
/// ユーザーのアクティブ状態設定リクエスト
/// </summary>
public class SetUserActiveStatusRequest
{
    public required bool IsActive { get; set; }
}
