using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.AI;

/// <summary>
/// AIクライアントファクトリーインターフェース
/// </summary>
public interface IAiClientFactory
{
    /// <summary>
    /// システムデフォルトのAIクライアントを取得
    /// （appsettings.json の APIキーを使用）
    /// </summary>
    /// <returns>AIクライアント</returns>
    /// <exception cref="InvalidOperationException">デフォルトプロバイダーが設定されていない場合</exception>
    IAiClient GetDefaultClient();

    /// <summary>
    /// 指定されたベンダーとAPIキーでAIクライアントを生成
    /// （組織設定の APIキーを使用）
    /// </summary>
    /// <param name="vendor">生成APIベンダー種別</param>
    /// <param name="apiKey">APIキー</param>
    /// <returns>
    /// AIクライアント。以下の場合はnullを返す:
    /// - vendor が None または未サポート
    /// - apiKey が未設定または空
    /// </returns>
    IAiClient? CreateClient(GenerativeApiVendor vendor, string? apiKey);
}
