using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Implementations;

/// <summary>
/// ワークスペースの健康状態についてコメントする振る舞い
/// </summary>
public class WorkspaceHealthBehavior : IBotBehavior
{
    /// <summary>
    /// プロジェクト管理モード用の視点
    /// </summary>
    private static readonly string[] ProjectPerspectives =
    [
        "完了率に注目して",
        "期限切れタスクに注目して",
        "進行中タスクの数に注目して",
        "今週の進捗に注目して",
        "残りタスク数に注目して"
    ];

    /// <summary>
    /// ドキュメントモード用の視点
    /// </summary>
    private static readonly string[] DocumentPerspectives =
    [
        "ドキュメントの鮮度に注目して",
        "長期未更新の記事に注目して",
        "今週の更新状況に注目して",
        "ナレッジの蓄積状況に注目して",
        "編集者の分布に注目して"
    ];

    private readonly IHealthDataProvider _healthDataProvider;
    private readonly IPerspectiveRotator _perspectiveRotator;
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<WorkspaceHealthBehavior> _logger;

    /// <summary>
    /// WorkspaceHealthBehavior のコンストラクタ
    /// </summary>
    public WorkspaceHealthBehavior(
        IHealthDataProvider healthDataProvider,
        IPerspectiveRotator perspectiveRotator,
        ApplicationDbContext dbContext,
        ILogger<WorkspaceHealthBehavior> logger)
    {
        _healthDataProvider = healthDataProvider;
        _perspectiveRotator = perspectiveRotator;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public string Name => "WorkspaceHealth";

    /// <summary>
    /// Weight 配分
    /// ※ WorkspaceHealth と OrganizationHealth は GroupChatScope により排他
    /// </summary>
    public int Weight => 20;

    /// <inheritdoc />
    public Task<bool> CanExecuteAsync(BotBehaviorContext context)
    {
        return Task.FromResult(context.IsWorkspaceScope && context.AiClient != null);
    }

    /// <inheritdoc />
    public async Task<string?> ExecuteAsync(BotBehaviorContext context)
    {
        if (context.AiClient == null || context.WorkspaceId == null)
        {
            return null;
        }

        // ワークスペースのモードを取得
        var workspaceMode = await _dbContext.Workspaces
            .Where(w => w.Id == context.WorkspaceId.Value)
            .Select(w => w.Mode)
            .FirstOrDefaultAsync();

        // モードを渡してデータ取得（ドキュメントモードの場合は追加統計も取得）
        var healthData = await _healthDataProvider.GetWorkspaceHealthDataAsync(
            context.WorkspaceId.Value,
            workspaceMode);

        // モードに応じた視点を選択
        var isDocumentMode = workspaceMode == WorkspaceMode.Document;
        var perspectives = isDocumentMode ? DocumentPerspectives : ProjectPerspectives;
        var perspective = _perspectiveRotator.GetNext(Name, context.WorkspaceId.Value, perspectives);

        // モードに応じたコンテキストを生成
        var modeContext = isDocumentMode
            ? @"

            【重要】これは「ドキュメント管理（ナレッジベース）」ワークスペースです。
            タスクではなくドキュメントの状況について呟いてください。
            - 「タスクの遅れ」→「情報の陳腐化」「更新の停滞」
            - 「期限切れ」→「長期未更新」「放置された記事」
            - 「完了率」→「更新頻度」「活性度」
            "
            : "";

        var targetDescription = isDocumentMode ? "ドキュメント状況" : "タスク状況";

        var systemPrompt = $@"
            あなたはチャットに参加しているボットです。
            会話の流れとは無関係に、ふと思い立ってワークスペースの{targetDescription}について呟きます。
            質問に答えるのではなく、独り言のように自然に発言してください。
            {modeContext}

            【参照データ】以下の統計データに基づいて呟いてください:
            {healthData.ToSummary()}

            【今回の注目ポイント】
            {perspective}

            【呟きルール】
            - 上記の注目ポイントを中心に、データの具体的な数字を必ず1つ以上言及
            - 「〜だね」「〜かな」「〜やん」など独り言っぽい語尾
            - 2-3文で簡潔に
            - 質問形式にしない（「どう思う？」などで終わらない）
            - 相手のメッセージに対する返事ではない
            - 物理的なオフィスや机の話はしない

            【口調】
            {context.Bot.Persona ?? "フレンドリーな口調で"}
            ";

        var messages = new List<(MessageRole Role, string Content)>
        {
            (MessageRole.User, $"ワークスペースの{targetDescription}について、{perspective}呟いて")
        };

        try
        {
            var responseText = await context.AiClient.GenerateTextWithMessagesAsync(
                messages,
                systemPrompt
            );

            return responseText ?? "...";
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "WorkspaceHealthBehavior execution failed: WorkspaceId={WorkspaceId}",
                context.WorkspaceId
            );
            return null;
        }
    }
}
