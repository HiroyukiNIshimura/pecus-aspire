using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Guards;

/// <summary>
/// Bot タスク実行前の共通チェックを提供するサービス
/// </summary>
/// <remarks>
/// 組織設定に基づいて Bot タスクの実行可否を判定します。
/// 新しい設定項目が追加された場合は、このインターフェースにメソッドを追加してください。
/// </remarks>
public interface IBotTaskGuard
{
    /// <summary>
    /// Bot 全体の有効/無効設定をチェック
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>有効の場合は true、無効の場合は false</returns>
    Task<(bool, AISignature?)> IsBotEnabledAsync(int organizationId);
}

/// <summary>
/// Bot の署名情報を表すレコード構造体
/// </summary>
public record AISignature(GenerativeApiVendor GenerativeApiVendor, string GenerativeApiModel, string GenerativeApiKey, bool BotGroupChatMessagesEnabled = false);
