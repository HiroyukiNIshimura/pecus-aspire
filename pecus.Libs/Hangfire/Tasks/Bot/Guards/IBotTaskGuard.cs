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
    /// グループチャットへのメッセージ送信が許可されているかチェック
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>許可されている場合は true、無効の場合は false</returns>
    Task<bool> IsGroupChatEnabledAsync(int organizationId);
}
