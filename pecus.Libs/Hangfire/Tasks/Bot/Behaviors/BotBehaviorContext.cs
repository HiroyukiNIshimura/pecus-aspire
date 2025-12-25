using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;

/// <summary>
/// ボットの振る舞い実行時のコンテキスト
/// </summary>
public class BotBehaviorContext
{
    /// <summary>
    /// 組織ID
    /// </summary>
    public required int OrganizationId { get; init; }

    /// <summary>
    /// チャットルーム
    /// </summary>
    public required ChatRoom Room { get; init; }

    /// <summary>
    /// トリガーとなったメッセージ
    /// </summary>
    public required ChatMessage TriggerMessage { get; init; }

    /// <summary>
    /// メッセージを送信したユーザー
    /// </summary>
    public required User SenderUser { get; init; }

    /// <summary>
    /// 使用する Bot
    /// </summary>
    public required DB.Models.Bot Bot { get; init; }

    /// <summary>
    /// AI クライアント（利用可能な場合）
    /// </summary>
    public IAiClient? AiClient { get; init; }

    /// <summary>
    /// データベースコンテキスト
    /// </summary>
    public required ApplicationDbContext DbContext { get; init; }

    /// <summary>
    /// 過去メッセージを取得するデリゲート
    /// </summary>
    public required Func<int, int, int?, Task<List<BotChatMessageInfo>>> GetRecentMessagesAsync { get; init; }

    /// <summary>
    /// ルームがワークスペーススコープかどうか
    /// </summary>
    public bool IsWorkspaceScope => Room.WorkspaceId != null;

    /// <summary>
    /// ワークスペースID（ワークスペーススコープの場合）
    /// </summary>
    public int? WorkspaceId => Room.WorkspaceId;
}
