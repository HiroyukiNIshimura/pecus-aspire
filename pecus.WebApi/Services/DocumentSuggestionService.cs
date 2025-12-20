using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Asn1.Nist;
using Pecus.Exceptions;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Services;

/// <summary>
/// ドキュメント提案サービス
/// </summary> <summary>
///
/// </summary>
public class DocumentSuggestionService
{
    private readonly ApplicationDbContext _context;
    private readonly IAiClient _aiClient;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="context"></param>
    /// <param name="aiClient"></param>
    public DocumentSuggestionService(ApplicationDbContext context, IAiClient aiClient)
    {
        _context = context;
        _aiClient = aiClient;
    }

    /// <summary>
    /// ドキュメント内容を提案
    /// </summary>
    /// <param name="workspace"></param>
    /// <param name="title"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<string> SuggestDocumentContentAsync(Workspace workspace, string title, CancellationToken cancellationToken = default)
    {
        var request = new
        {
            Title = title,
            AdditionalContext = $"{workspace.Genre?.Name}: {workspace.Description}",
        };

        return await _aiClient.GenerateMarkdownFromTitleAsync(request.Title, request.AdditionalContext, cancellationToken);
    }
}

