using System.Text.Json;
using System.Text.Json.Nodes;

namespace Pecus.Libs.Mail;

/// <summary>
/// アイテム通知メール用に Lexical JSON から本文プレビューを生成するヘルパー
/// </summary>
public static class ItemNotificationBodyPreviewBuilder
{
    private const int DefaultMaxBlocks = 2;

    /// <summary>
    /// Lexical JSON から先頭ブロックのみを抽出した本文プレビューを生成する
    /// </summary>
    /// <param name="lexicalJson">元の Lexical JSON</param>
    /// <param name="maxBlocks">抽出する top-level block 数</param>
    /// <returns>本文プレビュー生成結果。本文が空の場合は null</returns>
    public static ItemNotificationBodyPreviewSource? Create(string? lexicalJson, int maxBlocks = DefaultMaxBlocks)
    {
        if (string.IsNullOrWhiteSpace(lexicalJson))
        {
            return null;
        }

        if (maxBlocks <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxBlocks), maxBlocks, "maxBlocks は 1 以上である必要があります。");
        }

        var documentNode = JsonNode.Parse(lexicalJson) as JsonObject;
        var rootNode = documentNode?["root"] as JsonObject;
        var childNodes = rootNode?["children"] as JsonArray;

        if (documentNode == null || rootNode == null || childNodes == null || childNodes.Count == 0)
        {
            return null;
        }

        var previewChildren = new JsonArray();
        foreach (var childNode in childNodes.Take(maxBlocks))
        {
            previewChildren.Add(CloneNode(childNode));
        }

        var previewRoot = new JsonObject();
        foreach (var property in rootNode)
        {
            previewRoot[property.Key] = property.Key == "children"
                ? previewChildren
                : CloneNode(property.Value);
        }

        var previewDocument = new JsonObject();
        foreach (var property in documentNode)
        {
            previewDocument[property.Key] = property.Key == "root"
                ? previewRoot
                : CloneNode(property.Value);
        }

        return new ItemNotificationBodyPreviewSource(
            LexicalJson: previewDocument.ToJsonString(),
            IsTruncated: childNodes.Count > maxBlocks
        );
    }

    private static JsonNode? CloneNode(JsonNode? node)
    {
        return node == null ? null : JsonNode.Parse(node.ToJsonString());
    }
}

/// <summary>
/// アイテム通知メール本文プレビューの生成結果
/// </summary>
/// <param name="LexicalJson">プレビュー用に短縮した Lexical JSON</param>
/// <param name="IsTruncated">元本文より短縮されているか</param>
public sealed record ItemNotificationBodyPreviewSource(string LexicalJson, bool IsTruncated);
