namespace Pecus.Libs.Hangfire.Tasks.Bot;

/// <summary>
/// ルーム単位の Bot 返信ロックを管理するインターフェース
/// 同一ルームで複数の Bot タスクが同時に実行されることを防ぐ
/// </summary>
public interface IRoomReplyLock
{
    /// <summary>
    /// ロックの取得を試みる
    /// </summary>
    /// <param name="roomId">チャットルームID</param>
    /// <param name="ttl">ロックの有効期限</param>
    /// <returns>ロック取得成功時は IAsyncDisposable なハンドル、失敗時は null</returns>
    Task<IAsyncDisposable?> TryAcquireAsync(int roomId, TimeSpan ttl);
}
