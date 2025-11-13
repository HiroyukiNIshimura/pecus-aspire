using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Pecus.Filters;

/// <summary>
/// Swagger UI にセキュリティ要件を追加するフィルター
/// </summary>
public class SecurityRequirementsOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // [AllowAnonymous] 属性がある場合はセキュリティ要件を追加しない
        var hasAllowAnonymous = context.MethodInfo.DeclaringType?
            .GetCustomAttributes(true)
            .OfType<AllowAnonymousAttribute>()
            .Any() ?? false;

        if (!hasAllowAnonymous)
        {
            hasAllowAnonymous = context.MethodInfo
                .GetCustomAttributes(true)
                .OfType<AllowAnonymousAttribute>()
                .Any();
        }

        if (hasAllowAnonymous)
        {
            return;
        }

        // セキュリティスキームを適用
        operation.Security =
        [
            new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("bearerAuth")] = []
            }
        ];
    }
}
