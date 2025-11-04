namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// 端末の種類（簡易分類）
/// </summary>
public enum DeviceType
{
    /// <summary>
    /// ブラウザ（Web）
    /// </summary>
    Browser = 1,

    /// <summary>
    /// モバイルネイティブアプリ
    /// </summary>
    MobileApp = 2,

    /// <summary>
    /// デスクトップアプリ
    /// </summary>
    DesktopApp = 3,

    /// <summary>
    /// その他（分類できない端末）
    /// </summary>
    Other = 99,
}
