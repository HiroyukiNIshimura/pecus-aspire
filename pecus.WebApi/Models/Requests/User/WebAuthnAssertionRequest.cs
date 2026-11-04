using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.User;

/// <summary>
/// パスキー認証（アサーション）の検証リクエスト
/// </summary>
public class WebAuthnAssertionRequest
{
    /// <summary>
    /// オプション取得時に発行されたチャレンジID（ワンタイム）
    /// </summary>
    [Required(ErrorMessage = "チャレンジIDは必須です。")]
    public required string ChallengeId { get; set; }

    /// <summary>
    /// クレデンシャルID（base64url）
    /// </summary>
    [Required(ErrorMessage = "クレデンシャルIDは必須です。")]
    public required string Id { get; set; }

    /// <summary>
    /// クレデンシャルID（base64url、Id と同値）
    /// </summary>
    [Required(ErrorMessage = "RawIdは必須です。")]
    public required string RawId { get; set; }

    /// <summary>
    /// クレデンシャル種別
    /// </summary>
    public string Type { get; set; } = "public-key";

    /// <summary>
    /// 認証器の応答
    /// </summary>
    [Required(ErrorMessage = "認証器の応答は必須です。")]
    public required WebAuthnAssertionResponseData Response { get; set; }

    /// <summary>
    /// デバイス名
    /// </summary>
    [MaxLength(100, ErrorMessage = "デバイス名は100文字以内で入力してください。")]
    public string? DeviceName { get; set; }

    /// <summary>
    /// デバイスタイプ
    /// </summary>
    [Required(ErrorMessage = "デバイスタイプは必須です。")]
    [EnumDataType(typeof(Libs.DB.Models.Enums.DeviceType), ErrorMessage = "有効なデバイスタイプを指定してください。")]
    public required Libs.DB.Models.Enums.DeviceType DeviceType { get; set; }

    /// <summary>
    /// OSプラットフォーム
    /// </summary>
    [Required(ErrorMessage = "OSプラットフォームは必須です。")]
    [EnumDataType(typeof(Libs.DB.Models.Enums.OSPlatform), ErrorMessage = "有効なOSプラットフォームを指定してください。")]
    public required Libs.DB.Models.Enums.OSPlatform OS { get; set; }

    /// <summary>
    /// ユーザーエージェント
    /// </summary>
    [MaxLength(200, ErrorMessage = "ユーザーエージェント情報は200文字以内で入力してください。")]
    public string? UserAgent { get; set; }

    /// <summary>
    /// アプリバージョン
    /// </summary>
    [MaxLength(50, ErrorMessage = "アプリバージョンは50文字以内で入力してください。")]
    public string? AppVersion { get; set; }

    /// <summary>
    /// タイムゾーン
    /// </summary>
    [MaxLength(50, ErrorMessage = "タイムゾーンは50文字以内で入力してください。")]
    public string? Timezone { get; set; }

    /// <summary>
    /// ロケーション
    /// </summary>
    [MaxLength(200, ErrorMessage = "Locationは200文字以内で入力してください。")]
    public string? Location { get; set; }

    /// <summary>
    /// IPアドレス
    /// </summary>
    [MaxLength(45, ErrorMessage = "IPアドレスは45文字以内で入力してください。")]
    public string? IpAddress { get; set; }
}
