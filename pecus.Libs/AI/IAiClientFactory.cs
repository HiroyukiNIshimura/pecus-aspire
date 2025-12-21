namespace Pecus.Libs.AI;

/// <summary>
/// AIクライアントファクトリーインターフェース
/// 実行時に動的にプロバイダーを切り替えるためのファクトリー
/// </summary>
public interface IAiClientFactory
{
    /// <summary>
    /// システムデフォルトのAIクライアントを取得
    /// </summary>
    /// <returns>AIクライアント</returns>
    /// <exception cref="InvalidOperationException">デフォルトプロバイダーが設定されていない場合</exception>
    IAiClient GetDefaultClient();

    /// <summary>
    /// 組織設定に基づいてAIクライアントを取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>
    /// AIクライアント。以下の場合はnullを返す:
    /// - 組織設定が見つからない
    /// - GenerativeApiVendor が None
    /// - GenerativeApiKey が未設定または空
    /// </returns>
    Task<IAiClient?> GetClientForOrganizationAsync(int organizationId, CancellationToken cancellationToken = default);
}
