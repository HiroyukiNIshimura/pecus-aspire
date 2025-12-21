using Microsoft.EntityFrameworkCore;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Services;

/// <summary>
/// ドキュメント提案サービス
/// </summary>
public class DocumentSuggestionService
{
    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="context">DBコンテキスト</param>
    /// <param name="aiClientFactory">AIクライアントファクトリー</param>
    public DocumentSuggestionService(ApplicationDbContext context, IAiClientFactory aiClientFactory)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
    }

    /// <summary>
    /// ドキュメント内容を提案（システムデフォルトのAIプロバイダーを使用）
    /// </summary>
    /// <param name="workspace">ワークスペース</param>
    /// <param name="title">ドキュメントタイトル</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>提案されたドキュメント内容（Markdown形式）</returns>
    public async Task<string> SuggestDocumentContentAsync(
        Workspace workspace,
        string title,
        CancellationToken cancellationToken = default)
    {
        var aiClient = _aiClientFactory.GetDefaultClient();

        return await GenerateDocumentContentAsync(aiClient, workspace, title, cancellationToken);
    }

    /// <summary>
    /// ドキュメント内容を提案（組織設定のAIプロバイダーを使用）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="workspace">ワークスペース</param>
    /// <param name="title">ドキュメントタイトル</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>提案されたドキュメント内容（Markdown形式）。組織にAI設定がない場合はnull</returns>
    public async Task<string?> SuggestDocumentContentForOrganizationAsync(
        int organizationId,
        Workspace workspace,
        string title,
        CancellationToken cancellationToken = default)
    {
        var aiClient = await GetAiClientForOrganizationAsync(organizationId, cancellationToken);
        if (aiClient == null)
        {
            return null;
        }

        return await GenerateDocumentContentAsync(aiClient, workspace, title, cancellationToken);
    }

    /// <summary>
    /// 組織設定からAIクライアントを取得
    /// </summary>
    private async Task<IAiClient?> GetAiClientForOrganizationAsync(int organizationId, CancellationToken cancellationToken)
    {
        var setting = await _context.OrganizationSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId, cancellationToken);

        if (setting == null)
        {
            return null;
        }

        return _aiClientFactory.CreateClient(setting.GenerativeApiVendor, setting.GenerativeApiKey);
    }

    /// <summary>
    /// ドキュメント内容を生成（共通処理）
    /// </summary>
    private static async Task<string> GenerateDocumentContentAsync(
        IAiClient aiClient,
        Workspace workspace,
        string title,
        CancellationToken cancellationToken)
    {
        var additionalContext = $"{workspace.Genre?.Name}: {workspace.Name}: {workspace.Description}";
        return await aiClient.GenerateMarkdownFromTitleAsync(title, additionalContext, persona: null, cancellationToken);
    }
}