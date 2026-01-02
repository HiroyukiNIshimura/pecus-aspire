namespace Pecus.Models.Responses.User;

/// <summary>
/// デバイス一覧レスポンス（現在のデバイスPublicId付き）
/// </summary>
public class DeviceListResponse
{
    /// <summary>
    /// デバイス一覧
    /// </summary>
    public List<DeviceResponse> Devices { get; set; } = [];

    /// <summary>
    /// 現在のリクエストに対応するデバイスのPublicId
    /// リクエスト情報からマッチングして特定
    /// </summary>
    public string? CurrentDevicePublicId { get; set; }
}
