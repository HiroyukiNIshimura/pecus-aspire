namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// 外部公開API用APIキーのロール
/// </summary>
public enum ExternalApiKeyRole
{
    /// <summary>
    /// 読み取り専用
    /// </summary>
    ReadOnly = 1,

    /// <summary>
    /// フルアクセス（読み取り・書き込み）
    /// </summary>
    FullAccess = 2,
}
