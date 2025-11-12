using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using Pecus.Models.Responses.Common;
using Pecus.Services;
using Swashbuckle.AspNetCore.Swagger;
using System.Text.Json;

namespace Pecus.Controllers.Backend;

/// <summary>
/// OpenAPI仕様書管理コントローラー（バックエンド管理用）
/// </summary>
[Route("api/backend/specs")]
[Produces("application/json")]
[Tags("Backend - Specs")]
public class BackendSpecsController : BaseBackendController
{
    private readonly ISwaggerProvider _swaggerProvider;

    public BackendSpecsController(
        ISwaggerProvider swaggerProvider,
        ProfileService profileService,
        ILogger<BackendSpecsController> logger
    )
        : base(profileService, logger)
    {
        _swaggerProvider = swaggerProvider;
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
        var json = JsonSerializer.Serialize(swagger, new JsonSerializerOptions
        {
            WriteIndented = true
        });

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

        // OpenAPIドキュメントをYAML文字列に変換（シンプルな実装）
        // 注: 本格的なYAML出力が必要な場合は YamlDotNet パッケージを使用してください
        var json = JsonSerializer.Serialize(swagger);
        
        return TypedResults.Ok(json); // 暫定的にJSON形式を返す
    }
}
