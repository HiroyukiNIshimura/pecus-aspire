using Microsoft.EntityFrameworkCore;
using Pecus.Libs.AI;
using Pecus.Libs.DB;
using Pecus.Models.Requests.AiAssistant;

namespace Pecus.Services;

/// <summary>
/// AIアシスタントサービス
/// エディタ内のカーソル位置に適切なテキストを生成
/// </summary>
public class AiAssistantService : IAiAssistantService
{
    private readonly ApplicationDbContext _context;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly ILogger<AiAssistantService> _logger;

    private const string SystemPrompt = """
        あなたは文章執筆アシスタントです。
        与えられたMarkdown文書の指定された位置に最適な文章を生成してください。

        ## 指示
        - 前後の文脈に合わせて、自然な流れになるようにしてください
        - 出力はMarkdown形式でお願いします
        - 挿入位置のマーカーは出力に含めないでください
        - 生成するテキストのみを出力してください（説明や補足は不要）
        - 文体や表現は周囲の文章に合わせてください
        """;

    public AiAssistantService(
        ApplicationDbContext context,
        IAiClientFactory aiClientFactory,
        ILogger<AiAssistantService> logger)
    {
        _context = context;
        _aiClientFactory = aiClientFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<string?> GenerateTextAsync(
        int organizationId,
        GenerateTextRequest request,
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

        var userPrompt = BuildUserPrompt(request);

        try
        {
            var generatedText = await aiClient.GenerateTextAsync(
                SystemPrompt,
                userPrompt,
                persona: null,
                cancellationToken);

            return generatedText.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to generate text for organization {OrganizationId}",
                organizationId);
            return null;
        }
    }

    /// <summary>
    /// ユーザープロンプトを構築
    /// </summary>
    private static string BuildUserPrompt(GenerateTextRequest request)
    {
        return $"""
            ## 文書（カーソル位置: {request.CursorMarker}）

            {request.Markdown}

            ## ユーザーからの指示

            上記文書の「{request.CursorMarker}」部分に挿入する最適な文章を生成してください。
            ユーザーの要望: {request.UserPrompt}
            """;
    }

    /// <summary>
    /// 組織設定からAIクライアントを取得
    /// </summary>
    private async Task<IAiClient?> GetAiClientForOrganizationAsync(
        int organizationId,
        CancellationToken cancellationToken)
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
}
