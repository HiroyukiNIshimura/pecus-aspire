using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.AI;

/// <summary>
/// AIクライアントファクトリーインターフェース
/// </summary>
public interface IAiClientFactory
{
    /// <summary>
    /// 指定されたベンダー、APIキー、モデルでAIクライアントを生成
    /// （組織設定の APIキーを使用）
    /// </summary>
    /// <param name="vendor">生成APIベンダー種別</param>
    /// <param name="apiKey">APIキー（必須）</param>
    /// <param name="model">使用するモデル名（必須）</param>
    /// <returns>
    /// AIクライアント。vendor が None または未サポートの場合はnullを返す
    /// </returns>
    IAiClient? CreateClient(GenerativeApiVendor vendor, string apiKey, string model);
}