namespace Pecus.Libs.AI.Tools;

/// <summary>
/// Function Calling 用のツール定義（JSON Schema 形式）
/// </summary>
public record AiToolDefinition
{
    /// <summary>
    /// 関数名
    /// </summary>
    public required string Name { get; init; }

    /// <summary>
    /// 関数の説明
    /// </summary>
    public required string Description { get; init; }

    /// <summary>
    /// パラメータの JSON Schema
    /// </summary>
    public required AiToolParameters Parameters { get; init; }

    /// <summary>
    /// OpenAI Function Calling 形式にシリアライズ
    /// </summary>
    /// <returns>OpenAI API 互換のオブジェクト</returns>
    public object ToOpenAiFormat() => new
    {
        type = "function",
        function = new
        {
            name = Name,
            description = Description,
            parameters = Parameters.ToJsonSchema()
        }
    };

    /// <summary>
    /// Anthropic Claude Tool 形式にシリアライズ
    /// </summary>
    /// <returns>Anthropic API 互換のオブジェクト</returns>
    public object ToAnthropicFormat() => new
    {
        name = Name,
        description = Description,
        input_schema = Parameters.ToJsonSchema()
    };
}

/// <summary>
/// ツールパラメータの定義
/// </summary>
public record AiToolParameters
{
    /// <summary>
    /// パラメータのプロパティリスト
    /// </summary>
    public List<AiToolParameter> Properties { get; init; } = [];

    /// <summary>
    /// 必須パラメータ名のリスト
    /// </summary>
    public List<string> Required { get; init; } = [];

    /// <summary>
    /// JSON Schema 形式に変換
    /// </summary>
    /// <returns>JSON Schema オブジェクト</returns>
    public object ToJsonSchema() => new
    {
        type = "object",
        properties = Properties.ToDictionary(
            p => p.Name,
            p => p.ToJsonSchema()
        ),
        required = Required
    };
}

/// <summary>
/// 個別パラメータの定義
/// </summary>
public record AiToolParameter
{
    /// <summary>
    /// パラメータ名
    /// </summary>
    public required string Name { get; init; }

    /// <summary>
    /// パラメータの型（string, integer, number, boolean, array, object）
    /// </summary>
    public required string Type { get; init; }

    /// <summary>
    /// パラメータの説明
    /// </summary>
    public required string Description { get; init; }

    /// <summary>
    /// 許可される値のリスト（enum 制約）
    /// </summary>
    public List<string>? Enum { get; init; }

    /// <summary>
    /// JSON Schema 形式に変換
    /// </summary>
    /// <returns>JSON Schema オブジェクト</returns>
    public object ToJsonSchema()
    {
        var schema = new Dictionary<string, object>
        {
            ["type"] = Type,
            ["description"] = Description
        };
        if (Enum != null)
        {
            schema["enum"] = Enum;
        }
        return schema;
    }
}