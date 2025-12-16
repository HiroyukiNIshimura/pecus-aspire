using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Pecus.OpenApi;

/// <summary>
/// OpenAPI スキーマの整数型から string 型を除去するトランスフォーマー
/// .NET 10 の OpenAPI 生成では JavaScript の精度問題を考慮して
/// integer | string のユニオン型が生成されるが、
/// TypeScript クライアント生成時に number | string となり不便なため、
/// integer のみに統一する
/// </summary>
public sealed class IntegerSchemaTransformer : IOpenApiSchemaTransformer
{
    public Task TransformAsync(OpenApiSchema schema, OpenApiSchemaTransformerContext context, CancellationToken cancellationToken)
    {
        // Type が複数ある場合（例: ["integer", "string"]）
        if (schema.Type is JsonSchemaType combinedType)
        {
            // integer と string の両方が含まれている場合
            if (combinedType.HasFlag(JsonSchemaType.Integer) && combinedType.HasFlag(JsonSchemaType.String))
            {
                // nullable の場合は integer | null に、そうでなければ integer のみに
                if (combinedType.HasFlag(JsonSchemaType.Null))
                {
                    schema.Type = JsonSchemaType.Integer | JsonSchemaType.Null;
                }
                else
                {
                    schema.Type = JsonSchemaType.Integer;
                }

                // pattern は不要になるので削除
                schema.Pattern = null;
            }

            // number と string の両方が含まれている場合
            if (combinedType.HasFlag(JsonSchemaType.Number) && combinedType.HasFlag(JsonSchemaType.String))
            {
                // nullable の場合は number | null に、そうでなければ number のみに
                if (combinedType.HasFlag(JsonSchemaType.Null))
                {
                    schema.Type = JsonSchemaType.Number | JsonSchemaType.Null;
                }
                else
                {
                    schema.Type = JsonSchemaType.Number;
                }

                // pattern は不要になるので削除
                schema.Pattern = null;
            }
        }

        return Task.CompletedTask;
    }
}
