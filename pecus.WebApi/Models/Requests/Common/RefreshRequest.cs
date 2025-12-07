using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.Common;

/// <summary>
/// リフレッシュトークン交換 / ログアウト用リクエスト
/// </summary>
public class RefreshRequest
{
    /// <summary>
    /// クライアントから送られるリフレッシュトークン
    /// </summary>
    [Required(ErrorMessage = "リフレッシュトークンは必須です。")]
    [MaxLength(512, ErrorMessage = "リフレッシュトークンは512文字以内で指定してください。")]
    public required string RefreshToken { get; set; }

    /// <summary>
    /// デバイス名（任意）
    /// </summary>
    [MaxLength(100, ErrorMessage = "デバイス名は100文字以内で入力してください。")]
    public string? DeviceName { get; set; }

    /// <summary>
    /// 端末の種類（任意、未指定時は Browser 扱い）
    /// </summary>
    [EnumDataType(typeof(DeviceType), ErrorMessage = "有効なデバイスタイプを指定してください。")]
    public DeviceType? DeviceType { get; set; }

    /// <summary>
    /// OS プラットフォーム（任意、未指定時は Unknown）
    /// </summary>
    [EnumDataType(typeof(OSPlatform), ErrorMessage = "有効なOSプラットフォームを指定してください。")]
    public OSPlatform? OS { get; set; }

    /// <summary>
    /// User-Agent（ヘッダー優先、任意）
    /// </summary>
    [MaxLength(200, ErrorMessage = "ユーザーエージェント情報は200文字以内で入力してください。")]
    public string? UserAgent { get; set; }

    /// <summary>
    /// アプリバージョン（任意）
    /// </summary>
    [MaxLength(50, ErrorMessage = "アプリバージョンは50文字以内で入力してください。")]
    public string? AppVersion { get; set; }

    /// <summary>
    /// タイムゾーン（任意）
    /// </summary>
    [MaxLength(50, ErrorMessage = "タイムゾーンは50文字以内で入力してください。")]
    public string? Timezone { get; set; }

    /// <summary>
    /// ロケーション（任意）
    /// </summary>
    [MaxLength(200, ErrorMessage = "Locationは200文字以内で入力してください。")]
    public string? Location { get; set; }

    /// <summary>
    /// IPアドレス（任意、未指定時はサーバー側推定）
    /// </summary>
    [MaxLength(45, ErrorMessage = "IPアドレスは45文字以内で入力してください。")]
    public string? IpAddress { get; set; }
}