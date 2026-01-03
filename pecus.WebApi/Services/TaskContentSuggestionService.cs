using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.Lexical;

namespace Pecus.Services;

/// <summary>
/// タスク内容提案サービス
/// </summary>
public class TaskContentSuggestionService
{
    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly ILexicalConverterService _lexicalConverterService;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="context">DBコンテキスト</param>
    /// <param name="aiClientFactory">AIクライアントファクトリー</param>
    /// <param name="lexicalConverterService">Lexical変換サービス</param>
    public TaskContentSuggestionService(
        ApplicationDbContext context,
        IAiClientFactory aiClientFactory,
        ILexicalConverterService lexicalConverterService)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
        _lexicalConverterService = lexicalConverterService;
    }

    /// <summary>
    /// タスク内容を提案（組織設定のAIプロバイダーを使用）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="taskTypeId">タスクタイプID</param>
    /// <param name="workspaceContext">ワークスペースのコンテキスト情報</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>提案されたタスク内容（プレーンテキスト）。組織にAI設定がない場合はnull</returns>
    public async Task<string?> SuggestTaskContentForOrganizationAsync(
        int organizationId,
        int workspaceId,
        int itemId,
        int taskTypeId,
        string? workspaceContext,
        CancellationToken cancellationToken = default)
    {
        var item = await _context.WorkspaceItems
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == itemId && i.WorkspaceId == workspaceId, cancellationToken);

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        var taskType = await _context.TaskTypes
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == taskTypeId && t.IsActive, cancellationToken);

        if (taskType == null)
        {
            throw new NotFoundException("タスクタイプが見つかりません。");
        }

        var aiClient = await GetAiClientForOrganizationAsync(organizationId, cancellationToken);
        if (aiClient == null)
        {
            return null;
        }

        var itemBodyMarkdown = await ExtractMarkdownFromBodyAsync(item.Body, cancellationToken);

        return await GenerateTaskContentAsync(
            aiClient,
            item.Subject,
            itemBodyMarkdown,
            taskType.Name,
            workspaceContext,
            cancellationToken);
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
    /// タスク内容を生成（共通処理）
    /// </summary>
    private static async Task<string> GenerateTaskContentAsync(
        IAiClient aiClient,
        string itemSubject,
        string? itemBodyMarkdown,
        string taskTypeName,
        string? workspaceContext,
        CancellationToken cancellationToken)
    {
        var systemPrompt = """
            あなたはタスク管理のアシスタントです。
            与えられたアイテム情報（件名・本文）とタスクタイプから、具体的で実行可能なタスク内容を提案してください。

            ルール:
            - プレーンテキストで回答する（Markdownは使用しない）
            - 簡潔で具体的な内容にする（1〜3文程度）
            - タスクタイプに適した動詞で始める
            - 達成可能で測定可能な内容にする
            - 日本語で記述する
            - 最適解ではなく、あくまで参考例として提供する
            """;

        var userPromptBuilder = new System.Text.StringBuilder();
        userPromptBuilder.AppendLine($"アイテム件名: {itemSubject}");

        if (!string.IsNullOrWhiteSpace(itemBodyMarkdown))
        {
            var truncatedBody = itemBodyMarkdown.Length > 2000
                ? itemBodyMarkdown[..2000] + "..."
                : itemBodyMarkdown;
            userPromptBuilder.AppendLine($"アイテム本文（Markdown）: {truncatedBody}");
        }

        userPromptBuilder.AppendLine($"タスクタイプ: {taskTypeName}");

        if (!string.IsNullOrWhiteSpace(workspaceContext))
        {
            userPromptBuilder.AppendLine($"コンテキスト: {workspaceContext}");
        }

        return await aiClient.GenerateTextAsync(systemPrompt, userPromptBuilder.ToString(), persona: null, cancellationToken);
    }
}