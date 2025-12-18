using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.Lexical;
using Pecus.Services;
using System.Text;

namespace Pecus.Controllers;

/// <summary>
/// ワークスペースアイテムのエクスポート（ダウンロード）コントローラー
/// </summary>
[Route("api/workspaces/{workspaceId}/items/{itemId}/export")]
[Produces("application/json")]
[Tags("WorkspaceItem")]
public class WorkspaceItemExportController : BaseSecureController
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILexicalConverterService _lexicalConverterService;
    private readonly ILogger<WorkspaceItemExportController> _logger;

    public WorkspaceItemExportController(
        WorkspaceItemService workspaceItemService,
        OrganizationAccessHelper accessHelper,
        ILexicalConverterService lexicalConverterService,
        ProfileService profileService,
        ILogger<WorkspaceItemExportController> logger
    ) : base(profileService, logger)
    {
        _workspaceItemService = workspaceItemService;
        _accessHelper = accessHelper;
        _lexicalConverterService = lexicalConverterService;
        _logger = logger;
    }

    /// <summary>
    /// アイテムの Node データを JSON 形式でダウンロード
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>Lexical JSON ファイル</returns>
    [HttpGet("json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<FileContentHttpResult> DownloadAsJson(int workspaceId, int itemId)
    {
        var item = await GetAccessibleItemAsync(workspaceId, itemId);

        // Body が空の場合は空の EditorState を返す
        var jsonContent = item.Body ?? "{\"root\":{\"children\":[],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}";
        var bytes = Encoding.UTF8.GetBytes(jsonContent);
        var fileName = GenerateFileName(item.Subject, item.ItemNumber, "json");

        return TypedResults.File(
            bytes,
            contentType: "application/octet-stream",
            fileDownloadName: fileName
        );
    }

    /// <summary>
    /// アイテムの Node データを Markdown 形式でダウンロード
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>Markdown ファイル</returns>
    [HttpGet("markdown")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<FileContentHttpResult> DownloadAsMarkdown(int workspaceId, int itemId)
    {
        var item = await GetAccessibleItemAsync(workspaceId, itemId);

        // Body が空の場合は空文字を返す
        if (string.IsNullOrWhiteSpace(item.Body))
        {
            var emptyBytes = Encoding.UTF8.GetBytes(string.Empty);
            var emptyFileName = GenerateFileName(item.Subject, item.ItemNumber, "md");

            return TypedResults.File(
                emptyBytes,
                contentType: "application/octet-stream",
                fileDownloadName: emptyFileName
            );
        }

        // Lexical JSON を Markdown に変換
        var result = await _lexicalConverterService.ToMarkdownAsync(item.Body);

        if (!result.Success)
        {
            _logger.LogWarning(
                "Failed to convert item {ItemId} to Markdown: {Error}",
                itemId,
                result.ErrorMessage
            );
            throw new InvalidOperationException($"Markdown への変換に失敗しました: {result.ErrorMessage}");
        }

        var bytes = Encoding.UTF8.GetBytes(result.Result);
        var fileName = GenerateFileName(item.Subject, item.ItemNumber, "md");

        return TypedResults.File(
            bytes,
            contentType: "application/octet-stream",
            fileDownloadName: fileName
        );
    }

    /// <summary>
    /// アイテムの Node データを HTML 形式でダウンロード
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>HTML ファイル</returns>
    [HttpGet("html")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<FileContentHttpResult> DownloadAsHtml(int workspaceId, int itemId)
    {
        var item = await GetAccessibleItemAsync(workspaceId, itemId);

        // Body が空の場合は空の HTML を返す
        if (string.IsNullOrWhiteSpace(item.Body))
        {
            var emptyHtml = GenerateHtmlDocument(item.Subject, string.Empty);
            var emptyBytes = Encoding.UTF8.GetBytes(emptyHtml);
            var emptyFileName = GenerateFileName(item.Subject, item.ItemNumber, "html");

            return TypedResults.File(
                emptyBytes,
                contentType: "application/octet-stream",
                fileDownloadName: emptyFileName
            );
        }

        // Lexical JSON を HTML に変換
        var result = await _lexicalConverterService.ToHtmlAsync(item.Body);

        if (!result.Success)
        {
            _logger.LogWarning(
                "Failed to convert item {ItemId} to HTML: {Error}",
                itemId,
                result.ErrorMessage
            );
            throw new InvalidOperationException($"HTML への変換に失敗しました: {result.ErrorMessage}");
        }

        // 完全な HTML ドキュメントを生成
        var htmlDocument = GenerateHtmlDocument(item.Subject, result.Result);
        var bytes = Encoding.UTF8.GetBytes(htmlDocument);
        var fileName = GenerateFileName(item.Subject, item.ItemNumber, "html");

        return TypedResults.File(
            bytes,
            contentType: "application/octet-stream",
            fileDownloadName: fileName
        );
    }

    /// <summary>
    /// アクセス可能なアイテムを取得する
    /// </summary>
    private async Task<Pecus.Libs.DB.Models.WorkspaceItem> GetAccessibleItemAsync(int workspaceId, int itemId)
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        // アイテムを取得
        var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);
        return item;
    }

    /// <summary>
    /// ダウンロード用のファイル名を生成
    /// </summary>
    private static string GenerateFileName(string subject, int itemNumber, string extension)
    {
        // Subject をファイル名に使用可能な形式にサニタイズ
        var sanitizedSubject = SanitizeFileName(subject);
        if (string.IsNullOrWhiteSpace(sanitizedSubject))
        {
            sanitizedSubject = "item";
        }

        // 最大30文字に制限
        if (sanitizedSubject.Length > 30)
        {
            sanitizedSubject = sanitizedSubject[..30];
        }

        return $"{itemNumber}_{sanitizedSubject}.{extension}";
    }

    /// <summary>
    /// ファイル名として使用できない文字を除去
    /// </summary>
    private static string SanitizeFileName(string fileName)
    {
        // Windows/Unix で無効な文字を除去
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new StringBuilder();

        foreach (var c in fileName)
        {
            if (!invalidChars.Contains(c) && c != ' ')
            {
                sanitized.Append(c);
            }
            else if (c == ' ')
            {
                sanitized.Append('_');
            }
        }

        return sanitized.ToString();
    }

    /// <summary>
    /// 完全な HTML ドキュメントを生成
    /// </summary>
    private static string GenerateHtmlDocument(string title, string bodyContent)
    {
        var sanitizedTitle = System.Web.HttpUtility.HtmlEncode(title);
        return $$"""
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'unsafe-inline';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{{sanitizedTitle}}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        color: #333;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                    }
                    p {
                        margin: 1em 0;
                    }
                    code {
                        background-color: #f4f4f4;
                        padding: 0.2em 0.4em;
                        border-radius: 3px;
                        font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
                    }
                    pre {
                        background-color: #f4f4f4;
                        padding: 1em;
                        border-radius: 5px;
                        overflow-x: auto;
                    }
                    pre code {
                        background-color: transparent;
                        padding: 0;
                    }
                    blockquote {
                        border-left: 4px solid #ddd;
                        margin: 1em 0;
                        padding-left: 1em;
                        color: #666;
                    }
                    ul, ol {
                        margin: 1em 0;
                        padding-left: 2em;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 1em 0;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f4f4f4;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                    }
                </style>
            </head>
            <body>
                {{bodyContent}}
            </body>
            </html>
            """;
    }
}