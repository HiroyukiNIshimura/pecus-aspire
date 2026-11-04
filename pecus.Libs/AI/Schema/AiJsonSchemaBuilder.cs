using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Schema;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;

namespace Pecus.Libs.AI.Schema;

/// <summary>
/// DTO の型から JSON Schema を生成し、プロバイダーごとのサブセットへ正規化するビルダー
/// </summary>
/// <remarks>
/// 生成には .NET 9 以降の <see cref="JsonSchemaExporter"/> を使用する。
/// プロバイダーごとに受理できるスキーマが異なるため、送信直前に
/// <see cref="AiJsonSchemaProfile"/> に応じた正規化を行う。
/// </remarks>
public static class AiJsonSchemaBuilder
{
    private const int MaxInferDepth = 3;
    private const int MaxSchemaNameLength = 64;

    private static readonly JsonSerializerOptions SchemaSerializerOptions = CreateSchemaSerializerOptions();

    private static readonly JsonSchemaExporterOptions ExporterOptions = new()
    {
        TreatNullObliviousAsNonNullable = true,
        TransformSchemaNode = TransformSchemaNode
    };

    [ThreadStatic]
    private static int _inferDepth;

    /// <summary>
    /// 型から構造化出力スキーマの生成を試みる
    /// 生成できない型（未対応のカスタムコンバータなど）の場合は false を返す
    /// </summary>
    /// <param name="type">スキーマ生成対象の型</param>
    /// <param name="profile">プロバイダー別の正規化プロファイル</param>
    /// <param name="schema">生成されたスキーマ（失敗時は null）</param>
    /// <returns>生成に成功した場合は true</returns>
    public static bool TryBuild(
        Type type,
        AiJsonSchemaProfile profile,
        [NotNullWhen(true)] out AiJsonSchema? schema)
    {
        try
        {
            schema = Build(type, profile);
            return true;
        }
        catch (Exception)
        {
            schema = null;
            return false;
        }
    }

    /// <summary>
    /// 型から構造化出力スキーマを生成する
    /// </summary>
    /// <param name="type">スキーマ生成対象の型</param>
    /// <param name="profile">プロバイダー別の正規化プロファイル</param>
    /// <returns>正規化済みのスキーマ</returns>
    /// <exception cref="NotSupportedException">JSON Schema を生成できない型の場合</exception>
    public static AiJsonSchema Build(Type type, AiJsonSchemaProfile profile)
    {
        ArgumentNullException.ThrowIfNull(type);

        var node = JsonSchemaExporter.GetJsonSchemaAsNode(SchemaSerializerOptions, type, ExporterOptions);

        if (node is not JsonObject root)
        {
            throw new NotSupportedException($"JSON Schema のルートが object ではありません: {type.FullName}");
        }

        root.Remove("$schema");

        Normalize(root, profile);
        EnsureNoAnySchema(root, type);

        return new AiJsonSchema(BuildName(type), root);
    }

    /// <summary>
    /// スキーマ名をプロバイダーの命名制約（英数字・ハイフン・アンダースコア、64文字以内）へ正規化する
    /// </summary>
    private static string BuildName(Type type)
    {
        var raw = type.Name;
        var backtickIndex = raw.IndexOf('`', StringComparison.Ordinal);
        if (backtickIndex > 0)
        {
            raw = raw[..backtickIndex];
        }

        var sanitized = new string(raw.Where(c => char.IsAsciiLetterOrDigit(c) || c is '_' or '-').ToArray());
        if (sanitized.Length == 0)
        {
            sanitized = "response";
        }

        return sanitized.Length > MaxSchemaNameLength ? sanitized[..MaxSchemaNameLength] : sanitized;
    }

    private static JsonSerializerOptions CreateSchemaSerializerOptions()
    {
        // 実際のデシリアライズと同じ規則（enum は文字列）でスキーマを生成する
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            TypeInfoResolver = new DefaultJsonTypeInfoResolver
            {
                Modifiers = { IgnoreReadOnlyProperties }
            },
            Converters = { new JsonStringEnumConverter() }
        };
        return options;
    }

    /// <summary>
    /// 設定不可（get-only）のプロパティをスキーマから除外する
    /// 計算プロパティをスキーマに含めるとモデルに不要な値を生成させてしまうため
    /// </summary>
    private static void IgnoreReadOnlyProperties(JsonTypeInfo typeInfo)
    {
        if (typeInfo.Kind != JsonTypeInfoKind.Object)
        {
            return;
        }

        for (var i = typeInfo.Properties.Count - 1; i >= 0; i--)
        {
            if (typeInfo.Properties[i].Set is null)
            {
                typeInfo.Properties.RemoveAt(i);
            }
        }
    }

    private static JsonNode TransformSchemaNode(JsonSchemaExporterContext context, JsonNode schema)
    {
        // カスタムコンバータを持つプロパティは "any"（true）になるため、CLR 型から型情報を補う
        if (schema is JsonValue value && value.TryGetValue<bool>(out var isAny) && isAny)
        {
            if (context.PropertyInfo is { } propertyInfo && InferSchema(propertyInfo.PropertyType) is { } inferred)
            {
                return inferred;
            }

            return schema;
        }

        // enum のみのノードは型が省略されるため string を補う
        if (schema is JsonObject obj &&
            !obj.ContainsKey("type") &&
            obj["enum"] is JsonArray enumValues &&
            enumValues.Count > 0 &&
            enumValues.All(v => v is JsonValue ev && ev.TryGetValue<string>(out _)))
        {
            obj["type"] = "string";
        }

        return schema;
    }

    /// <summary>
    /// 型情報を失ったプロパティのスキーマを CLR 型から再生成する
    /// </summary>
    private static JsonNode? InferSchema(Type type)
    {
        if (_inferDepth >= MaxInferDepth)
        {
            return null;
        }

        _inferDepth++;
        try
        {
            var node = JsonSchemaExporter.GetJsonSchemaAsNode(SchemaSerializerOptions, type, ExporterOptions);

            // 再生成しても "any" のままの型（object など）はスキーマとして扱わない
            if (node is JsonObject obj && obj.Count > 0)
            {
                // PropertyType からは NRT 注釈が失われるため、null 許容型は明示的に union へ含める
                if (AllowsNull(type) && obj["type"] is { } typeNode)
                {
                    obj["type"] = AddNullToType(typeNode);
                }

                return obj;
            }

            return null;
        }
        catch (NotSupportedException)
        {
            return null;
        }
        finally
        {
            _inferDepth--;
        }
    }

    private static bool AllowsNull(Type type) =>
        Nullable.GetUnderlyingType(type) is not null || !type.IsValueType;

    private static JsonNode AddNullToType(JsonNode typeNode)
    {
        if (typeNode is JsonValue value && value.TryGetValue<string>(out var typeName))
        {
            return new JsonArray(typeName, "null");
        }

        if (typeNode is JsonArray array && !array.Any(v => v is JsonValue ev && ev.TryGetValue<string>(out var s) && s == "null"))
        {
            array.Add("null");
        }

        return typeNode;
    }

    private static void Normalize(JsonObject root, AiJsonSchemaProfile profile)
    {
        Walk(root);

        void Walk(JsonNode? node)
        {
            if (node is JsonArray array)
            {
                foreach (var item in array)
                {
                    Walk(item);
                }
                return;
            }

            if (node is not JsonObject obj)
            {
                return;
            }

            foreach (var keyword in GetUnsupportedKeywords(profile))
            {
                obj.Remove(keyword);
            }

            if ((profile is AiJsonSchemaProfile.OpenAiStrict or AiJsonSchemaProfile.Anthropic or AiJsonSchemaProfile.Kimi) &&
                obj["properties"] is JsonObject)
            {
                obj["additionalProperties"] = false;
            }

            if (profile == AiJsonSchemaProfile.OpenAiStrict && obj["properties"] is JsonObject properties)
            {
                var required = new JsonArray();
                foreach (var property in properties)
                {
                    required.Add(property.Key);
                }
                obj["required"] = required;
            }

            if (profile == AiJsonSchemaProfile.Anthropic &&
                obj["minItems"] is JsonValue minItems &&
                minItems.TryGetValue<int>(out var minItemsValue) &&
                minItemsValue > 1)
            {
                obj.Remove("minItems");
            }

            if (profile == AiJsonSchemaProfile.Anthropic)
            {
                // Anthropic は配列の minItems 0/1 のみサポートする
                obj.Remove("maxItems");
            }

            foreach (var child in obj.ToList())
            {
                Walk(child.Value);
            }
        }
    }

    private static IEnumerable<string> GetUnsupportedKeywords(AiJsonSchemaProfile profile)
    {
        yield return "$schema";
        yield return "propertyOrdering";

        switch (profile)
        {
            case AiJsonSchemaProfile.OpenAiStrict:
                yield return "allOf";
                yield return "not";
                yield return "if";
                yield return "then";
                yield return "else";
                yield return "dependentRequired";
                yield return "dependentSchemas";
                yield return "minProperties";
                yield return "maxProperties";
                yield return "uniqueItems";
                yield return "contains";
                yield return "minContains";
                yield return "maxContains";
                break;

            case AiJsonSchemaProfile.Anthropic:
                yield return "allOf";
                yield return "minimum";
                yield return "maximum";
                yield return "exclusiveMinimum";
                yield return "exclusiveMaximum";
                yield return "multipleOf";
                yield return "minLength";
                yield return "maxLength";
                yield return "minProperties";
                yield return "maxProperties";
                yield return "uniqueItems";
                yield return "contains";
                yield return "minContains";
                yield return "maxContains";
                break;

            case AiJsonSchemaProfile.Gemini:
                yield return "minLength";
                yield return "maxLength";
                yield return "minProperties";
                yield return "maxProperties";
                yield return "uniqueItems";
                yield return "contains";
                yield return "minContains";
                yield return "maxContains";
                break;

            case AiJsonSchemaProfile.Kimi:
                yield return "allOf";
                yield return "not";
                yield return "if";
                yield return "then";
                yield return "else";
                yield return "dependentRequired";
                yield return "dependentSchemas";
                yield return "minProperties";
                yield return "maxProperties";
                yield return "uniqueItems";
                yield return "contains";
                yield return "minContains";
                yield return "maxContains";
                break;
        }
    }

    /// <summary>
    /// 型情報を持たないスキーマ（true）が残っていないことを確認する
    /// 残っているとプロバイダー側で 400 になるため、生成失敗として扱う
    /// </summary>
    private static void EnsureNoAnySchema(JsonNode? node, Type type)
    {
        switch (node)
        {
            case JsonValue value when value.TryGetValue<bool>(out var isAny) && isAny:
                throw new NotSupportedException(
                    $"型情報を持たないプロパティがあるため JSON Schema を生成できません: {type.FullName}");
            case JsonObject obj:
                foreach (var child in obj)
                {
                    EnsureNoAnySchema(child.Value, type);
                }
                break;
            case JsonArray array:
                foreach (var item in array)
                {
                    EnsureNoAnySchema(item, type);
                }
                break;
        }
    }
}
