namespace Pecus.Libs.DB.Models;

/// <summary>
/// ユーザーが登録したパスキー（WebAuthn クレデンシャル）
/// </summary>
/// <remarks>
/// 1 ユーザーが複数のクレデンシャルを持てる。同期パスキーは複数端末で共有されるため
/// 端末（<see cref="Device"/>）とは 1:1 ではない。<see cref="DeviceId"/> は表示用の任意紐づけ。
/// </remarks>
public class UserCredential
{
    /// <summary>
    /// クレデンシャルID（PK）
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ユーザーID（FK）
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ユーザー（ナビゲーションプロパティ）
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// 認証器が発行したクレデンシャルID（システム内でユニーク）
    /// </summary>
    public required byte[] CredentialId { get; set; }

    /// <summary>
    /// 認証器の公開鍵
    /// </summary>
    public required byte[] PublicKey { get; set; }

    /// <summary>
    /// 署名カウンタ（同期パスキーでは 0 のまま／増加しないことがある）
    /// </summary>
    public uint SignCount { get; set; }

    /// <summary>
    /// 認証器が申告したトランスポート（カンマ区切り）
    /// </summary>
    public string? Transports { get; set; }

    /// <summary>
    /// 認証器の AAGUID（不明な場合は null）
    /// </summary>
    public Guid? Aaguid { get; set; }

    /// <summary>
    /// バックアップ対象になり得る認証器か（同期パスキーの判定に使用）
    /// </summary>
    public bool IsBackupEligible { get; set; }

    /// <summary>
    /// バックアップ済みの認証器か（同期パスキーの判定に使用）
    /// </summary>
    public bool IsBackedUp { get; set; }

    /// <summary>
    /// ユーザーが付けた表示名
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// 紐づく端末ID（任意）
    /// </summary>
    public int? DeviceId { get; set; }

    /// <summary>
    /// 紐づく端末（ナビゲーションプロパティ）
    /// </summary>
    public Device? Device { get; set; }

    /// <summary>
    /// 登録日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 最終使用日時
    /// </summary>
    public DateTimeOffset? LastUsedAt { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}
