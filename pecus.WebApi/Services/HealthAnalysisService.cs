using Microsoft.EntityFrameworkCore;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;
using Pecus.Libs.Hangfire.Tasks.Bot.Guards;
using Pecus.Models.Requests.Dashboard;
using Pecus.Models.Responses.Dashboard;

namespace Pecus.Services;

/// <summary>
/// 健康診断サービス
/// 生成AIを使用して組織/ワークスペースの健康状態を分析
/// </summary>
public class HealthAnalysisService
{
    private readonly ApplicationDbContext _context;
    private readonly IHealthDataProvider _healthDataProvider;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly IBotTaskGuard _botTaskGuard;
    private readonly ILogger<HealthAnalysisService> _logger;

    public HealthAnalysisService(
        ApplicationDbContext context,
        IHealthDataProvider healthDataProvider,
        IAiClientFactory aiClientFactory,
        IBotTaskGuard botTaskGuard,
        ILogger<HealthAnalysisService> logger)
    {
        _context = context;
        _healthDataProvider = healthDataProvider;
        _aiClientFactory = aiClientFactory;
        _botTaskGuard = botTaskGuard;
        _logger = logger;
    }

    /// <summary>
    /// 健康診断を実行
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="request">診断リクエスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>診断結果</returns>
    public async Task<HealthAnalysisResponse?> AnalyzeAsync(
        int organizationId,
        HealthAnalysisRequest request,
        CancellationToken cancellationToken = default)
    {
        var aiClient = await GetAiClientForOrganizationAsync(organizationId, cancellationToken);
        if (aiClient == null)
        {
            _logger.LogWarning(
                "AI client not available for organization {OrganizationId}",
                organizationId);
            return null;
        }

        // 健康データを取得
        HealthData healthData;
        string? workspaceName = null;

        if (request.Scope == HealthAnalysisScope.Workspace && request.WorkspaceId.HasValue)
        {
            healthData = await _healthDataProvider.GetWorkspaceHealthDataAsync(request.WorkspaceId.Value);
            var workspace = await _context.Workspaces
                .AsNoTracking()
                .Where(w => w.Id == request.WorkspaceId.Value)
                .Select(w => new { w.Name })
                .FirstOrDefaultAsync(cancellationToken);
            workspaceName = workspace?.Name;
        }
        else
        {
            healthData = await _healthDataProvider.GetOrganizationHealthDataAsync(organizationId);
        }

        // プロンプトを構築
        var systemPrompt = BuildSystemPrompt(request.AnalysisType, request.Scope, workspaceName);
        var userPrompt = BuildUserPrompt(healthData, request.AnalysisType);

        try
        {
            var analysis = await aiClient.GenerateTextAsync(
                systemPrompt,
                userPrompt,
                persona: null,
                cancellationToken);

            return new HealthAnalysisResponse
            {
                AnalysisType = request.AnalysisType,
                Scope = request.Scope,
                WorkspaceId = request.WorkspaceId,
                WorkspaceName = workspaceName,
                Analysis = analysis.Trim(),
                GeneratedAt = DateTimeOffset.UtcNow,
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Health analysis failed: OrganizationId={OrganizationId}, Scope={Scope}, Type={Type}",
                organizationId,
                request.Scope,
                request.AnalysisType);
            return null;
        }
    }

    /// <summary>
    /// システムプロンプトを構築
    /// </summary>
    private static string BuildSystemPrompt(
        HealthAnalysisType analysisType,
        HealthAnalysisScope scope,
        string? workspaceName)
    {
        var targetName = scope == HealthAnalysisScope.Workspace && workspaceName != null
            ? $"ワークスペース「{workspaceName}」"
            : "組織全体";

        var basePrompt = $"""
            あなたはプロジェクト管理の専門家です。
            {targetName}のタスク統計データを分析し、的確なフィードバックを提供してください。

            【回答ルール】
            - データに基づいた客観的な分析を行う
            - 具体的な数値を引用して説明する
            - 専門用語を避け、わかりやすい日本語で説明する
            - Markdown形式で回答する
            """;

        var specificPrompt = analysisType switch
        {
            HealthAnalysisType.CurrentHealth => """

                【分析の観点】
                - 現在の全体的な健康状態を評価（良好/注意/要改善）
                - タスク完了率、期限切れ率、未アサイン率から状況を判断
                - ポジティブな点とネガティブな点をバランスよく説明
                - 200-300文字程度で簡潔にまとめる
                """,

            HealthAnalysisType.ProblemPickup => """

                【分析の観点】
                - 現在の問題点を優先度順にリストアップ
                - 各問題点について、なぜ問題なのかを簡潔に説明
                - 問題がない場合は、その旨を伝える
                - 箇条書きで3-5点を目安に
                """,

            HealthAnalysisType.FuturePrediction => """

                【分析の観点】
                - 週次トレンドから今後1-2週間の状況を予測
                - タスク蓄積/消化の傾向を分析
                - このままの傾向が続いた場合のリスクを説明
                - 楽観的すぎず、悲観的すぎない現実的な予測を
                """,

            HealthAnalysisType.Recommendation => """

                【分析の観点】
                - 具体的で実行可能な改善アクションを提案
                - 優先度の高い順に3-5点を提示
                - 各アクションの期待効果も簡潔に説明
                - 抽象的な提案ではなく、すぐに実行できる内容を
                """,

            HealthAnalysisType.Comparison => """

                【分析の観点】
                - 週次トレンドデータから前週との変化を分析
                - 改善した点、悪化した点を明確に
                - 変化の要因について推測を含めて説明
                - 変化がない場合は安定している旨を伝える
                """,

            HealthAnalysisType.Summary => """

                【分析の観点】
                - 総合的な健康診断レポートを作成
                - 現状評価、問題点、今後の予測、改善提案を含める
                - 経営層や管理者向けの簡潔なサマリー形式
                - 400-500文字程度でまとめる
                """,

            _ => "",
        };

        return basePrompt + specificPrompt;
    }

    /// <summary>
    /// ユーザープロンプトを構築
    /// </summary>
    private static string BuildUserPrompt(HealthData healthData, HealthAnalysisType analysisType)
    {
        var typeLabel = analysisType switch
        {
            HealthAnalysisType.CurrentHealth => "現在の健康状態",
            HealthAnalysisType.ProblemPickup => "問題点のピックアップ",
            HealthAnalysisType.FuturePrediction => "今後の予測",
            HealthAnalysisType.Recommendation => "改善提案",
            HealthAnalysisType.Comparison => "前週との比較",
            HealthAnalysisType.Summary => "総合レポート",
            _ => "分析",
        };

        return $"""
            ## 統計データ

            {healthData.ToSummary()}

            ## リクエスト

            上記データに基づいて、{typeLabel}を行ってください。
            """;
    }

    /// <summary>
    /// 組織設定からAIクライアントを取得
    /// </summary>
    private async Task<IAiClient?> GetAiClientForOrganizationAsync(
        int organizationId,
        CancellationToken cancellationToken)
    {
        var (isEnabled, signature) = await _botTaskGuard.IsBotEnabledAsync(organizationId);

        if (!isEnabled || signature == null)
        {
            return null;
        }

        return _aiClientFactory.CreateClient(
            signature.GenerativeApiVendor,
            signature.GenerativeApiKey,
            signature.GenerativeApiModel);
    }
}
