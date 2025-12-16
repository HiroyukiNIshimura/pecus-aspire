using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;
using System.Text.Json.Nodes;

namespace Pecus.OpenApi;

/// <summary>
/// Enum 型を文字列として OpenAPI スキーマに出力するトランスフォーマー
/// .NET の JsonStringEnumConverter を使用していても、OpenAPI スキーマでは
/// デフォルトで integer として出力されるため、明示的に string + enum 値に変換する
/// </summary>
public sealed class EnumSchemaTransformer : IOpenApiSchemaTransformer
{
    public Task TransformAsync(OpenApiSchema schema, OpenApiSchemaTransformerContext context, CancellationToken cancellationToken)
    {
        // コンテキストから型情報を取得
        var type = context.JsonTypeInfo.Type;

        // Nullable<T> の場合は内部の型を取得
        var underlyingType = Nullable.GetUnderlyingType(type);
        var enumType = underlyingType ?? type;

        // Enum 型の場合のみ処理
        if (enumType.IsEnum)
        {
            // Enum の値を文字列として取得
            var enumNames = Enum.GetNames(enumType);

            // スキーマを文字列型に変更
            if (underlyingType != null)
            {
                // Nullable<Enum> の場合
                schema.Type = JsonSchemaType.String | JsonSchemaType.Null;
            }
            else
            {
                schema.Type = JsonSchemaType.String;
            }

            // Enum 値を設定（JsonNode を使用）
            schema.Enum = enumNames
                .Select(name => (JsonNode)JsonValue.Create(name)!)
                .ToList();
        }

        return Task.CompletedTask;
    }
}
