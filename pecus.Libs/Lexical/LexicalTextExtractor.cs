using System.Text.Json.Nodes;

namespace Pecus.Libs.Lexical;

/// <summary>
/// Lexical エディタの JSON から検索用プレーンテキストを抽出するユーティリティ
/// </summary>
public static class LexicalTextExtractor
{
    /// <summary>
    /// Lexical の Body JSON からプレーンテキストを抽出する
    /// </summary>
    /// <param name="bodyJson">Lexical の JSON 文字列</param>
    /// <returns>抽出されたプレーンテキスト（スペース区切り）</returns>
    public static string ExtractText(string? bodyJson)
    {
        if (string.IsNullOrWhiteSpace(bodyJson))
        {
            return string.Empty;
        }

        try
        {
            var root = JsonNode.Parse(bodyJson);
            if (root is null)
            {
                return string.Empty;
            }

            var texts = new List<string>();
            var stack = new Stack<JsonNode>();
            stack.Push(root);

            while (stack.Count > 0)
            {
                var node = stack.Pop();

                switch (node)
                {
                    case JsonObject obj:
                        // "text" プロパティがあれば収集
                        if (obj.TryGetPropertyValue("text", out var textNode) &&
                            textNode is JsonValue textValue &&
                            textValue.TryGetValue<string>(out var text) &&
                            !string.IsNullOrWhiteSpace(text))
                        {
                            texts.Add(text);
                        }

                        // 全プロパティをスタックに追加（逆順で追加して順序を維持）
                        var properties = obj.ToList();
                        for (var i = properties.Count - 1; i >= 0; i--)
                        {
                            if (properties[i].Value is not null)
                            {
                                stack.Push(properties[i].Value!);
                            }
                        }
                        break;

                    case JsonArray arr:
                        // 逆順で追加して順序を維持
                        for (var i = arr.Count - 1; i >= 0; i--)
                        {
                            if (arr[i] is not null)
                            {
                                stack.Push(arr[i]!);
                            }
                        }
                        break;
                }
            }

            return string.Join(" ", texts).Trim();
        }
        catch (System.Text.Json.JsonException)
        {
            return string.Empty;
        }
    }
}
