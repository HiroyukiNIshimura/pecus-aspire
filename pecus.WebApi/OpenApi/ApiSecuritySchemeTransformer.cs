using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
using Pecus.Authentication;

namespace Pecus.OpenApi;

/// <summary>
/// OpenAPI ドキュメントに認証スキームを登録し、API ごとに認証要件を割り当てるトランスフォーマー
/// </summary>
public sealed class ApiSecuritySchemeTransformer(IAuthenticationSchemeProvider authenticationSchemeProvider) : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        var authenticationSchemes = await authenticationSchemeProvider.GetAllSchemesAsync();
        var authenticationSchemeNames = authenticationSchemes
            .Select(authenticationScheme => authenticationScheme.Name)
            .ToHashSet(StringComparer.Ordinal);

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        if (authenticationSchemeNames.Contains(JwtBearerDefaults.AuthenticationScheme))
        {
            document.Components.SecuritySchemes[JwtBearerDefaults.AuthenticationScheme] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "JWT Authorization header using the Bearer scheme.",
            };
        }

        if (authenticationSchemeNames.Contains(ApiKeyAuthenticationOptions.SchemeName))
        {
            document.Components.SecuritySchemes[ApiKeyAuthenticationOptions.SchemeName] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.ApiKey,
                In = ParameterLocation.Header,
                Name = ApiKeyAuthenticationOptions.HeaderName,
                Description = "External API key sent in the X-API-KEY header.",
            };
        }

        if (document.Paths is not { } paths)
        {
            return;
        }

        foreach (var (path, pathItem) in paths)
        {
            // External Controller の共通 Route は api/external であり、API Key 認証を使用する。
            var schemeName = path.StartsWith("/api/external/", StringComparison.Ordinal)
                ? ApiKeyAuthenticationOptions.SchemeName
                : JwtBearerDefaults.AuthenticationScheme;

            if (!document.Components.SecuritySchemes.ContainsKey(schemeName))
            {
                continue;
            }

            var securityRequirement = new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference(schemeName, document)] = []
            };

            foreach (var operation in pathItem.Operations ?? [])
            {
                // OpenAPI の security 配列は OR 条件のため、対象operationの要件で置き換える。
                operation.Value.Security = [securityRequirement];
            }
        }
    }
}