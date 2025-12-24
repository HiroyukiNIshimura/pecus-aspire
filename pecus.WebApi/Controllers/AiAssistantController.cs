using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Models.Requests.AiAssistant;
using Pecus.Models.Responses.AiAssistant;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// AIアシスタントコントローラー
/// エディタ内でのAIテキスト生成機能を提供
/// </summary>
[Route("api/ai-assistant")]
public class AiAssistantController : BaseSecureController
{
    private readonly IAiAssistantService _aiAssistantService;

    public AiAssistantController(
        ProfileService profileService,
        ILogger<AiAssistantController> logger,
        IAiAssistantService aiAssistantService)
        : base(profileService, logger)
    {
        _aiAssistantService = aiAssistantService;
    }

    /// <summary>
    /// エディタのカーソル位置に挿入するテキストを生成
    /// </summary>
    /// <param name="request">テキスト生成リクエスト</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>生成されたテキスト</returns>
    /// <response code="200">テキスト生成成功</response>
    /// <response code="503">AI機能が利用できない（組織設定が未構成）</response>
    [HttpPost("generate")]
    [ProducesResponseType<GenerateTextResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<Results<Ok<GenerateTextResponse>, StatusCodeHttpResult>> GenerateText(
        [FromBody] GenerateTextRequest request,
        CancellationToken cancellationToken)
    {
        var generatedText = await _aiAssistantService.GenerateTextAsync(
            CurrentOrganizationId,
            request,
            cancellationToken);

        if (generatedText == null)
        {
            return TypedResults.StatusCode(StatusCodes.Status503ServiceUnavailable);
        }

        return TypedResults.Ok(new GenerateTextResponse
        {
            GeneratedText = generatedText
        });
    }
}
