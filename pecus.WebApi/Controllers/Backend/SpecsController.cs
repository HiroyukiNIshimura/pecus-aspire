using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Writers;
using Swashbuckle.AspNetCore.Swagger;

namespace Pecus.Controllers.Backend;

/// <summary>
/// OpenAPI仕様書管理コントローラー（バックエンド管理用）
/// </summary>
[ApiController]
[Route("api/backend/specs")]
[Produces("application/json")]
[Authorize(Roles = "Backend")]
public class SpecsController : ControllerBase
{
    private readonly ISwaggerProvider _swaggerProvider;
    private readonly ILogger<SpecsController> _logger;

    public SpecsController(ISwaggerProvider swaggerProvider, ILogger<SpecsController> logger)
    {
        _swaggerProvider = swaggerProvider;
        _logger = logger;
    }

    /// <summary>
    /// OpenAPIスキーマ取得
    /// </summary>
    /// <remarks>
    /// Swagger UIで生成されたOpenAPI 3.0スキーマをJSON形式で取得します。
    /// </remarks>
    /// <param name="documentName">ドキュメント名（デフォルト: v1）</param>
    [HttpGet("openapi")]
    [HttpGet("openapi/{documentName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult GetOpenApiSchema(string documentName = "v1")
    {
        try
        {
            var swagger = _swaggerProvider.GetSwagger(documentName);

            // OpenAPIドキュメントをJSON文字列に変換
            using var stringWriter = new StringWriter();
            var jsonWriter = new OpenApiJsonWriter(stringWriter);
            swagger.SerializeAsV3(jsonWriter);
            var json = stringWriter.ToString();

            return Content(json, "application/json");
        }
        catch (UnknownSwaggerDocument)
        {
            _logger.LogWarning(
                "OpenAPIドキュメントが見つかりませんでした。DocumentName: {DocumentName}",
                documentName
            );
            return NotFound(
                new { message = $"OpenAPIドキュメント '{documentName}' が見つかりません。" }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "OpenAPIスキーマ取得中にエラーが発生しました。DocumentName: {DocumentName}",
                documentName
            );
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "OpenAPIスキーマの取得に失敗しました。" }
            );
        }
    }

    /// <summary>
    /// OpenAPIスキーマ取得（YAML形式）
    /// </summary>
    /// <remarks>
    /// Swagger UIで生成されたOpenAPI 3.0スキーマをYAML形式で取得します。
    /// </remarks>
    /// <param name="documentName">ドキュメント名（デフォルト: v1）</param>
    [HttpGet("openapi.yaml")]
    [HttpGet("openapi/{documentName}.yaml")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult GetOpenApiSchemaYaml(string documentName = "v1")
    {
        try
        {
            var swagger = _swaggerProvider.GetSwagger(documentName);

            // OpenAPIドキュメントをYAML文字列に変換
            using var stringWriter = new StringWriter();
            var yamlWriter = new OpenApiYamlWriter(stringWriter);
            swagger.SerializeAsV3(yamlWriter);
            var yaml = stringWriter.ToString();

            return Content(yaml, "application/yaml");
        }
        catch (UnknownSwaggerDocument)
        {
            _logger.LogWarning(
                "OpenAPIドキュメントが見つかりませんでした。DocumentName: {DocumentName}",
                documentName
            );
            return NotFound(
                new { message = $"OpenAPIドキュメント '{documentName}' が見つかりません。" }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "OpenAPIスキーマ(YAML)取得中にエラーが発生しました。DocumentName: {DocumentName}",
                documentName
            );
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "OpenAPIスキーマの取得に失敗しました。" }
            );
        }
    }
}
