using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

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
    /// 組織設定
    /// </summary>
    public required OrganizationSetting OrganizationSetting { get; init; }

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
    /// グループチャットがワークスペーススコープかどうか（組織設定に基づく）
    /// </summary>
    public bool IsWorkspaceScope =>
        OrganizationSetting.GroupChatScope == null ||
        OrganizationSetting.GroupChatScope == GroupChatScope.Workspace;

    /// <summary>
    /// ワークスペースID（ワークスペーススコープかつルームにWorkspaceIdがある場合）
    /// </summary>
    public int? WorkspaceId => IsWorkspaceScope ? Room.WorkspaceId : null;
}