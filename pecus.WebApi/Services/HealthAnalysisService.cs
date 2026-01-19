using Microsoft.EntityFrameworkCore;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.Hangfire.Tasks.Bot.Behaviors;
using Pecus.Libs.Hangfire.Tasks.Bot.Guards;
using Pecus.Models.Requests.Dashboard;
using Pecus.Models.Responses.Dashboard;
using StackExchange.Redis;
using System.Text.Json;

namespace Pecus.Services;

/// <summary>
/// 健康診断サービス
/// 生成AIを使用して組織/ワークスペースの健康状態を分析
/// Redis キャッシュにより AI 呼び出しコストを削減
/// </summary>
public class HealthAnalysisService
{
    private readonly ApplicationDbContext _context;
    private readonly IHealthDataProvider _healthDataProvider;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly IBotTaskGuard _botTaskGuard;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<HealthAnalysisService> _logger;

    /// <summary>
    /// キャッシュキーのプレフィックス
    /// </summary>
    private const string CacheKeyPrefix = "health-analysis";

    // キャッシュ TTL（有効期間）定数
    private static readonly TimeSpan CacheTtlDefault = TimeSpan.FromHours(1);
    private static readonly TimeSpan CacheTtlFuturePrediction = TimeSpan.FromHours(6);
    private static readonly TimeSpan CacheTtlComparison = TimeSpan.FromHours(24);

    public HealthAnalysisService(
        ApplicationDbContext context,
        IHealthDataProvider healthDataProvider,
        IAiClientFactory aiClientFactory,
        IBotTaskGuard botTaskGuard,
        IConnectionMultiplexer redis,
        ILogger<HealthAnalysisService> logger)
    {
        _context = context;
        _healthDataProvider = healthDataProvider;
        _aiClientFactory = aiClientFactory;
        _botTaskGuard = botTaskGuard;
        _redis = redis;
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
        // キャッシュキーを生成
        var cacheKey = BuildCacheKey(organizationId, request);
        var db = _redis.GetDatabase();

        // キャッシュを確認
        var cached = await db.StringGetAsync(cacheKey);
        if (cached.HasValue)
        {
            _logger.LogDebug("Cache hit for health analysis: {CacheKey}", cacheKey);
            try
            {
                return JsonSerializer.Deserialize<HealthAnalysisResponse>((string)cached!);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize cached health analysis, regenerating");
            }
        }

        // AI クライアントを取得
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

            var result = new HealthAnalysisResponse
            {
                AnalysisType = request.AnalysisType,
                Scope = request.Scope,
                WorkspaceId = request.WorkspaceId,
                WorkspaceName = workspaceName,
                Analysis = analysis.Trim(),
                GeneratedAt = DateTimeOffset.UtcNow,
            };

            // キャッシュに保存
            var ttl = GetCacheTtl(request.AnalysisType);
            var json = JsonSerializer.Serialize(result);
            await db.StringSetAsync(cacheKey, json, ttl);
            _logger.LogDebug("Cached health analysis: {CacheKey}, TTL: {Ttl}", cacheKey, ttl);

            return result;
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
    /// キャッシュキーを生成
    /// </summary>
    private static string BuildCacheKey(int organizationId, HealthAnalysisRequest request)
    {
        var workspaceIdPart = request.Scope == HealthAnalysisScope.Workspace && request.WorkspaceId.HasValue
            ? request.WorkspaceId.Value.ToString()
            : "all";
        return $"{CacheKeyPrefix}:{organizationId}:{request.Scope}:{workspaceIdPart}:{request.AnalysisType}";
    }

    /// <summary>
    /// 分析タイプに応じたキャッシュ有効期間を取得
    /// </summary>
    private static TimeSpan GetCacheTtl(HealthAnalysisType analysisType)
    {
        return analysisType switch
        {
            HealthAnalysisType.FuturePrediction => CacheTtlFuturePrediction,
            HealthAnalysisType.Comparison => CacheTtlComparison,
            _ => CacheTtlDefault,
        };
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
            あなたは組織の頼れるアドバイザーです。
            {targetName}のタスク状況を見て、わかりやすくフィードバックしてください。

            【絶対に守るルール】
            - 小学生でもわかる簡単な言葉で説明する
            - 難しい専門用語は使わない
            - 数字を使って具体的に説明する
            - 短い文で、要点だけ伝える
            - 絵文字を適度に使って親しみやすく
            - Markdown形式で読みやすく
            - 見出しは必ず ## や ### を使う（**太字**を見出し代わりにしない）
            - 各セクションの間は空行を入れる
            """;

        var specificPrompt = analysisType switch
        {
            HealthAnalysisType.CurrentHealth => """

                【やること】
                今の状態を「😊 順調」「⚠️ ちょっと心配」「🚨 要注意」のどれかで教えて、
                その理由を2-3行で簡単に説明してください。

                例：
                ## 😊 順調です！
                タスクの8割が予定通り進んでいます。期限切れも少なく、いい感じ！
                """,

            HealthAnalysisType.ProblemPickup => """

                【やること】
                気になる点を3つまで教えてください。
                各項目は ### 見出しで区切り、1-2行で説明してください。
                問題がなければ「特に心配なし！」と伝えてください。

                例：
                ## 気になる点

                ### ⚠️ 期限切れタスクが多い
                5件のタスクが期限を過ぎています。早めに対応しましょう。

                ### 📋 担当者が決まっていない
                3件のタスクに担当者がいません。誰かにお願いしましょう。
                """,

            HealthAnalysisType.FuturePrediction => """

                【やること】
                このままいくと来週どうなりそうか、2-3行で予想してください。
                良い予想でも悪い予想でも、正直に伝えてください。

                例：
                ## 来週の見通し
                今のペースなら来週も順調そう！ただ、新しいタスクが増えているので、
                少し注意しておくといいかも。
                """,

            HealthAnalysisType.Recommendation => """

                【やること】
                今すぐできる改善アクションを3つまで、具体的に提案してください。
                「〜しましょう」という形で、すぐ実行できる内容にしてください。

                例：
                ## おすすめアクション
                1. 📌 期限切れの5件を今日中に確認しましょう
                2. 👤 未アサインの3件に担当者を決めましょう
                """,

            HealthAnalysisType.Comparison => """

                【やること】
                先週と比べてどう変わったか教えてください。
                良くなった点と気になる点を ### 見出しで分けて説明してください。
                変化がなければ「安定しています」と伝えてください。

                例：
                ## 先週との比較

                ### ✅ 良くなった点
                完了タスクが先週より10件増えました！いい調子です。

                ### ⚠️ 気をつけたい点
                新規タスクも増えているので、油断は禁物です。
                """,

            HealthAnalysisType.Summary => """

                【やること】
                全体の状況を短くまとめてください。
                「今の状態」「気になる点」「おすすめ」の3つを、それぞれ1-2行で。

                例：
                ## 📊 まとめ
                **今の状態**: 8割順調、2割が遅れ気味
                **気になる点**: 期限切れが少し増えてきた
                **おすすめ**: 今週中に期限切れを片付けよう
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
