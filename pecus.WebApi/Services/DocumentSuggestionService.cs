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

        var request = new
        {
            Title = title,
            AdditionalContext = $"{workspace.Genre?.Name}: {workspace.Name}: {workspace.Description}",
        };

        return await aiClient.GenerateMarkdownFromTitleAsync(request.Title, request.AdditionalContext, cancellationToken);
    }
}

