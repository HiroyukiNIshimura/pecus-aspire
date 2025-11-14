using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests;

/// <summary>
/// ログインリクエスト
/// </summary>
public class LoginRequest
{
    [Required(ErrorMessage = "ログイン識別子は必須です。")]
    public required string LoginIdentifier { get; set; }

    [Required(ErrorMessage = "パスワードは必須です。")]
    public required string Password { get; set; }

    [MaxLength(100, ErrorMessage = "デバイス名は100文字以内で入力してください。")]
    public string? DeviceName { get; set; }

    [Required(ErrorMessage = "デバイスタイプは必須です。")]
    [EnumDataType(typeof(DeviceType), ErrorMessage = "有効なデバイスタイプを指定してください。")]
    public required DeviceType DeviceType { get; set; }

    [Required(ErrorMessage = "OSプラットフォームは必須です。")]
    [EnumDataType(typeof(OSPlatform), ErrorMessage = "有効なOSプラットフォームを指定してください。")]
    public required OSPlatform OS { get; set; }

    [MaxLength(200, ErrorMessage = "ユーザーエージェント情報は200文字以内で入力してください。")]
    public string? UserAgent { get; set; }

    [MaxLength(50, ErrorMessage = "アプリバージョンは50文字以内で入力してください。")]
    public string? AppVersion { get; set; }

    [MaxLength(50, ErrorMessage = "タイムゾーンは50文字以内で入力してください。")]
    public string? Timezone { get; set; }

    [MaxLength(200, ErrorMessage = "Locationは200文字以内で入力してください。")]
    public string? Location { get; set; }

    [MaxLength(45, ErrorMessage = "IPアドレスは45文字以内で入力してください。")]
    public string? IpAddress { get; set; }
}
