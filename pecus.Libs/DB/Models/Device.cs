using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Pecus.Libs.DB.Models;

/// <summary>
/// ユーザーがログインした端末／セッションを表すエンティティ
/// WebAPI 上でユーザーがどの端末からログインしているかを識別・管理するために使用します。
/// </summary>
public class Device
{
    /// <summary>
    /// 端末ID（PK）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 表示用短ID（例: ユーザー向けに見せる短縮GUID）
    /// </summary>
    public required string PublicId { get; set; }

    /// <summary>
    /// クライアント側生成の識別子をハッシュ化して保存（照合用）
    /// </summary>
    public required string HashedIdentifier { get; set; }

    /// <summary>
    /// ユーザーが任意で付ける表示名（nullable）
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 端末の種類（Browser / MobileApp / DesktopApp）
    /// </summary>
    public DeviceType DeviceType { get; set; }

    /// <summary>
    /// クライアント OS（Windows/macOS/Linux/iOS/Android 等）
    /// </summary>
    public OSPlatform OS { get; set; }

    /// <summary>
    /// 簡易化した User-Agent（例: "Chrome 118"）
    /// </summary>
    public string? Client { get; set; }

    /// <summary>
    /// ネイティブアプリ等のバージョン
    /// </summary>
    public string? AppVersion { get; set; }

    /// <summary>
    /// 初回確認日時（UTC）
    /// </summary>
    public DateTime FirstSeenAt { get; set; }

    /// <summary>
    /// 最終確認日時（UTC）
    /// </summary>
    public DateTime LastSeenAt { get; set; }

    /// <summary>
    /// 表示用にマスクしたIPアドレス（例: 203.0.113.xxx）
    /// </summary>
    public string? LastIpMasked { get; set; }

    /// <summary>
    /// GeoIP による概算ロケーション（国/都市など、nullable）
    /// </summary>
    public string? LastSeenLocation { get; set; }

    /// <summary>
    /// クライアントが提供するタイムゾーン（表示調整用、nullable）
    /// </summary>
    public string? Timezone { get; set; }

    /// <summary>
    /// 当該端末に紐づく有効リフレッシュトークン数（表示専用）。
    /// DB 上で集計してセットする想定のためマップしないプロパティにすることが想定されます。
    /// </summary>
    [NotMapped]
    public int RefreshTokenCount { get; set; }

    /// <summary>
    /// 無効化フラグ（端末を管理者またはユーザーが無効化したか）
    /// </summary>
    public bool IsRevoked { get; set; }

    /// <summary>
    /// ユーザーID（FK）
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// 紐づくリフレッシュトークン群
    /// </summary>
    public List<RefreshToken> RefreshTokens { get; set; } = new();

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}