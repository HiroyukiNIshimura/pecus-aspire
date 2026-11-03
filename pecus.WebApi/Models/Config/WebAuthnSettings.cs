namespace Pecus.Models.Config;

/// <summary>
/// WebAuthn (FIDO2) 設定
/// </summary>
/// <remarks>
/// <see cref="RpId"/> と <see cref="Origins"/> はフロントエンドのオリジンと一致させる必要がある。
/// 本番環境では必ず https を指定する（localhost のみ http が許可される）。
/// </remarks>
public class WebAuthnSettings
{
    /// <summary>
    /// Relying Party ID（フロントエンドのホスト名。例: coati.0t0.jp）
    /// </summary>
    public string RpId { get; set; } = "localhost";

    /// <summary>
    /// Relying Party の表示名
    /// </summary>
    public string RpName { get; set; } = "Coati";

    /// <summary>
    /// 許可するオリジン一覧（フロントエンドのオリジン）
    /// </summary>
    public List<string> Origins { get; set; } = new();

    /// <summary>
    /// 認証器のタイムスタンプ許容誤差（ミリ秒）
    /// </summary>
    public int TimestampDriftToleranceMs { get; set; } = 300_000;

    /// <summary>
    /// リカバリーコードのハッシュに使用する鍵（十分な長さのランダム文字列）
    /// </summary>
    public string RecoveryCodePepper { get; set; } = "CHANGE_ME_RECOVERY_CODE_PEPPER_IN_PRODUCTION";
}
