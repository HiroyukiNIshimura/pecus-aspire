using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Writers;
using Pecus.Models.Responses.Common;
using Swashbuckle.AspNetCore.Swagger;

namespace Pecus.Controllers.Backend;

/// <summary>
/// OpenAPI仕様書管理コントローラー（バックエンド管理用）
/// </summary>
[ApiController]
[Route("api/backend/specs")]
[Produces("application/json")]
[Authorize(Roles = "Backend")]
public class BackendSpecsController : ControllerBase
{
    private readonly ISwaggerProvider _swaggerProvider;
    private readonly ILogger<BackendSpecsController> _logger;

    public BackendSpecsController(
        ISwaggerProvider swaggerProvider,
        ILogger<BackendSpecsController> logger
    )
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
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status500InternalServerError)]
    public Ok<string> GetOpenApiSchema(string documentName = "v1")
    {
        var swagger = _swaggerProvider.GetSwagger(documentName);

        // OpenAPIドキュメントをJSON文字列に変換
        using var stringWriter = new StringWriter();
        var jsonWriter = new OpenApiJsonWriter(stringWriter);
        swagger.SerializeAsV3(jsonWriter);
        var json = stringWriter.ToString();

        return TypedResults.Ok(json);
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
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status500InternalServerError)]
    public Ok<string> GetOpenApiSchemaYaml(string documentName = "v1")
    {
        var swagger = _swaggerProvider.GetSwagger(documentName);

        // OpenAPIドキュメントをYAML文字列に変換
        using var stringWriter = new StringWriter();
        var yamlWriter = new OpenApiYamlWriter(stringWriter);
        swagger.SerializeAsV3(yamlWriter);
        var yaml = stringWriter.ToString();

        return TypedResults.Ok(yaml);
    }
}
