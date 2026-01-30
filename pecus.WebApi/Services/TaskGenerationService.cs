using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.AI;
using Pecus.Libs.AI.Prompts.Tasks;
using Pecus.Libs.DB;
using Pecus.Libs.Lexical;
using Pecus.Models.Requests.WorkspaceTask;
using Pecus.Models.Responses.WorkspaceTask;

namespace Pecus.Services;

/// <summary>
/// タスク候補生成サービス
/// </summary>
public class TaskGenerationService
{
    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly ILexicalConverterService _lexicalConverterService;
    private readonly ILogger<TaskGenerationService> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public TaskGenerationService(
        ApplicationDbContext context,
        IAiClientFactory aiClientFactory,
        ILexicalConverterService lexicalConverterService,
        ILogger<TaskGenerationService> logger)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
        _lexicalConverterService = lexicalConverterService;
        _logger = logger;
    }

    /// <summary>
    /// タスク候補を生成（組織設定のAIプロバイダーを使用）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="request">生成リクエスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたタスク候補。組織にAI設定がない場合はnull</returns>
    public async Task<TaskGenerationResponse?> GenerateTaskCandidatesAsync(
        int organizationId,
        int workspaceId,
        int itemId,
        GenerateTaskCandidatesRequest request,
        CancellationToken cancellationToken = default)
    {
        // ワークスペースアイテムの取得
        var item = await _context.WorkspaceItems
            .AsNoTracking()
            .Include(i => i.Workspace)
            .ThenInclude(w => w!.Genre)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.WorkspaceId == workspaceId, cancellationToken);

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        // AIクライアントの取得
        var aiClient = await GetAiClientForOrganizationAsync(organizationId, cancellationToken);
        if (aiClient == null)
        {
            _logger.LogWarning("組織ID {OrganizationId} にAI設定がありません。", organizationId);
            return null;
        }

        // タスクタイプ一覧の取得
        var taskTypes = await _context.TaskTypes
            .AsNoTracking()
            .Where(t => t.IsActive)
            .OrderBy(t => t.DisplayOrder)
            .Select(t => new TaskTypeInfo(t.Id, t.Code, t.Name, t.Description))
            .ToListAsync(cancellationToken);

        if (taskTypes.Count == 0)
        {
            throw new InvalidOperationException("利用可能なタスクタイプがありません。");
        }

        // ワークスペースのメンバー数を取得
        var memberCount = await _context.WorkspaceUsers
            .AsNoTracking()
            .CountAsync(wu => wu.WorkspaceId == workspaceId, cancellationToken);

        // アイテム本文をMarkdownに変換
        var itemBodyMarkdown = await ExtractMarkdownFromBodyAsync(item.Body, cancellationToken);

        // 終了日の決定（リクエストで指定されていない場合はアイテムのDueDateを使用）
        var endDate = request.EndDate ?? (item.DueDate.HasValue
            ? DateOnly.FromDateTime(item.DueDate.Value.Date)
            : request.StartDate.AddMonths(1)); // デフォルトは開始日から1ヶ月後

        // プロンプト入力の構築
        var promptInput = new TaskGenerationInput(
            WorkspaceGenre: item.Workspace?.Genre?.Name,
            MemberCount: memberCount,
            ItemSubject: item.Subject,
            ItemBodyMarkdown: itemBodyMarkdown,
            StartDate: request.StartDate,
            EndDate: endDate,
            TaskTypes: taskTypes,
            AdditionalContext: request.AdditionalContext,
            Feedback: request.Feedback,
            PreviousCandidates: request.PreviousCandidates?
                .Select(p => new PreviousCandidateInfo(p.Content, p.IsAccepted, p.RejectionReason))
                .ToList()
        );

        // AIでタスク候補を生成
        var response = await GenerateWithAiAsync(aiClient, promptInput, cancellationToken);

        _logger.LogInformation(
            "タスク候補を生成しました。OrganizationId={OrganizationId}, WorkspaceId={WorkspaceId}, ItemId={ItemId}, CandidateCount={Count}",
            organizationId, workspaceId, itemId, response.Candidates.Count);

        return response;
    }

    /// <summary>
    /// AIを使用してタスク候補を生成
    /// </summary>
    private async Task<TaskGenerationResponse> GenerateWithAiAsync(
        IAiClient aiClient,
        TaskGenerationInput input,
        CancellationToken cancellationToken)
    {
        var template = new TaskGenerationPromptTemplate();
        var systemPrompt = template.BuildSystemPrompt(input);
        var userPrompt = template.BuildUserPrompt(input);

        try
        {
            // 構造化されたJSONレスポンスを生成
            var response = await aiClient.GenerateJsonAsync<AiTaskGenerationResponse>(
                systemPrompt,
                userPrompt,
                persona: null,
                cancellationToken);

            // レスポンスの変換
            return new TaskGenerationResponse
            {
                Candidates = response.Candidates.Select(c => new GeneratedTaskCandidate
                {
                    TempId = c.TempId ?? Guid.NewGuid().ToString(),
                    Content = c.Content ?? string.Empty,
                    SuggestedTaskTypeId = c.SuggestedTaskTypeId,
                    TaskTypeRationale = c.TaskTypeRationale,
                    EstimatedSize = ParseEstimatedSize(c.EstimatedSize),
                    PredecessorTempIds = c.PredecessorTempIds ?? [],
                    IsOnCriticalPath = c.IsOnCriticalPath,
                    CanParallelize = c.CanParallelize,
                    SuggestedStartDayOffset = c.SuggestedStartDayOffset,
                    SuggestedDurationDays = c.SuggestedDurationDays,
                    Rationale = c.Rationale
                }).ToList(),
                TotalEstimatedDays = response.TotalEstimatedDays,
                CriticalPathDescription = response.CriticalPathDescription,
                Suggestions = response.Suggestions ?? []
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AIによるタスク候補生成に失敗しました。");
            throw new InvalidOperationException("タスク候補の生成に失敗しました。しばらく待ってから再度お試しください。", ex);
        }
    }

    /// <summary>
    /// 文字列からEstimatedSizeを解析
    /// </summary>
    private static EstimatedSize ParseEstimatedSize(string? size)
    {
        return size?.ToUpperInvariant() switch
        {
            "S" => EstimatedSize.S,
            "M" => EstimatedSize.M,
            "L" => EstimatedSize.L,
            "XL" => EstimatedSize.XL,
            _ => EstimatedSize.M // デフォルト
        };
    }

    /// <summary>
    /// アイテム本文からMarkdownを抽出
    /// </summary>
    private async Task<string?> ExtractMarkdownFromBodyAsync(string? body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        var result = await _lexicalConverterService.ToMarkdownAsync(body, cancellationToken);
        if (!result.Success || string.IsNullOrWhiteSpace(result.Result))
        {
            return null;
        }

        return result.Result;
    }

    /// <summary>
    /// 組織設定からAIクライアントを取得
    /// </summary>
    private async Task<IAiClient?> GetAiClientForOrganizationAsync(int organizationId, CancellationToken cancellationToken)
    {
        var setting = await _context.OrganizationSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, cancellationToken);

        if (setting == null ||
            string.IsNullOrEmpty(setting.GenerativeApiKey) ||
            string.IsNullOrEmpty(setting.GenerativeApiModel))
        {
            return null;
        }

        return _aiClientFactory.CreateClient(
            setting.GenerativeApiVendor,
            setting.GenerativeApiKey,
            setting.GenerativeApiModel);
    }

    /// <summary>
    /// AI応答用の内部クラス（デシリアライズ用）
    /// </summary>
    private class AiTaskGenerationResponse
    {
        public List<AiTaskCandidate> Candidates { get; set; } = [];
        public int TotalEstimatedDays { get; set; }
        public string? CriticalPathDescription { get; set; }
        public List<string>? Suggestions { get; set; }
    }

    /// <summary>
    /// AIが生成するタスク候補（デシリアライズ用）
    /// </summary>
    private class AiTaskCandidate
    {
        public string? TempId { get; set; }
        public string? Content { get; set; }
        public int? SuggestedTaskTypeId { get; set; }
        public string? TaskTypeRationale { get; set; }
        public string? EstimatedSize { get; set; }
        public List<string>? PredecessorTempIds { get; set; }
        public bool IsOnCriticalPath { get; set; }
        public bool CanParallelize { get; set; }
        public int SuggestedStartDayOffset { get; set; }
        public int SuggestedDurationDays { get; set; }
        public string? Rationale { get; set; }
    }
}
