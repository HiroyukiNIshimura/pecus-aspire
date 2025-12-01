using System.Text;
using System.Text.Json.Nodes;

namespace Pecus.Libs.Lexical;

/// <summary>
/// Lexical エディタの JSON から検索用プレーンテキストを抽出するユーティリティ
/// </summary>
public static class LexicalTextExtractor
{
    /// <summary>
    /// テキストノードを直接含むブロックタイプ（テキストコンテナ）
    /// </summary>
    private static readonly HashSet<string> TextContainerTypes =
    [
        "paragraph",
        "heading",
        "quote",
        "listitem",
        "code",
    ];

    /// <summary>
    /// Lexical の Body JSON からプレーンテキストを抽出する
    /// </summary>
    /// <param name="bodyJson">Lexical の JSON 文字列</param>
    /// <returns>抽出されたプレーンテキスト（スペース区切り）</returns>
    /// <remarks>
    /// children 配列内の mode="normal" を持つテキストノードは区切り文字なしで連結され、
    /// 各テキストコンテナブロック（paragraph, heading, quote, listitem）ごとに
    /// 1つのテキストとしてスペース区切りで結合されます。
    /// </remarks>
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
            ExtractFromNode(root, texts);

            return string.Join(" ", texts).Trim();
        }
        catch (System.Text.Json.JsonException)
        {
            return string.Empty;
        }
    }

    /// <summary>
    /// ノードからテキストを再帰的に抽出する
    /// </summary>
    /// <param name="node">処理対象のノード</param>
    /// <param name="texts">抽出されたテキストを格納するリスト</param>
    private static void ExtractFromNode(JsonNode node, List<string> texts)
    {
        switch (node)
        {
            case JsonObject obj:
                // ノードタイプを取得
                var nodeType = GetNodeType(obj);

                // children 配列を取得
                if (obj.TryGetPropertyValue("children", out var childrenNode) &&
                    childrenNode is JsonArray childrenArray)
                {
                    // テキストコンテナタイプの場合、children 内のテキストを連結して収集
                    if (nodeType is not null && TextContainerTypes.Contains(nodeType))
                    {
                        var concatenatedText = ExtractTextFromChildren(childrenArray);
                        if (!string.IsNullOrWhiteSpace(concatenatedText))
                        {
                            texts.Add(concatenatedText);
                        }
                    }
                    else
                    {
                        // コンテナタイプでない場合（root, table, tablerow, tablecell, list など）は
                        // children を再帰的に探索
                        foreach (var child in childrenArray)
                        {
                            if (child is not null)
                            {
                                ExtractFromNode(child, texts);
                            }
                        }
                    }
                }
                else
                {
                    // children がない場合は他のプロパティを探索
                    foreach (var property in obj)
                    {
                        if (property.Value is not null)
                        {
                            ExtractFromNode(property.Value, texts);
                        }
                    }
                }
                break;

            case JsonArray arr:
                foreach (var item in arr)
                {
                    if (item is not null)
                    {
                        ExtractFromNode(item, texts);
                    }
                }
                break;
        }
    }

    /// <summary>
    /// JsonObject から type プロパティの値を取得する
    /// </summary>
    /// <param name="obj">JsonObject</param>
    /// <returns>type の値、存在しない場合は null</returns>
    private static string? GetNodeType(JsonObject obj)
    {
        if (obj.TryGetPropertyValue("type", out var typeNode) &&
            typeNode is JsonValue typeValue &&
            typeValue.TryGetValue<string>(out var type))
        {
            return type;
        }
        return null;
    }

    /// <summary>
    /// children 配列から mode="normal" のテキストを区切り文字なしで連結して抽出する
    /// </summary>
    /// <param name="childrenArray">children 配列</param>
    /// <returns>連結されたテキスト</returns>
    private static string ExtractTextFromChildren(JsonArray childrenArray)
    {
        var sb = new StringBuilder();

        foreach (var child in childrenArray)
        {
            if (child is JsonObject childObj)
            {
                // mode="normal" かつ text プロパティを持つノードからテキストを抽出
                if (childObj.TryGetPropertyValue("mode", out var modeNode) &&
                    modeNode is JsonValue modeValue &&
                    modeValue.TryGetValue<string>(out var mode) &&
                    mode == "normal" &&
                    childObj.TryGetPropertyValue("text", out var textNode) &&
                    textNode is JsonValue textValue &&
                    textValue.TryGetValue<string>(out var text))
                {
                    sb.Append(text);
                }

                // ネストされた children（例: link ノード内）からも抽出
                if (childObj.TryGetPropertyValue("children", out var nestedChildrenNode) &&
                    nestedChildrenNode is JsonArray nestedChildrenArray)
                {
                    sb.Append(ExtractTextFromChildren(nestedChildrenArray));
                }
            }
        }

        return sb.ToString();
    }
}