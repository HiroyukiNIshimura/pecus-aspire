using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.Mail.Preview;
using Pecus.Libs.Mail.Services;
using Pecus.Libs.Mail.Templates.Models;

namespace Pecus.Controllers.Dev;

/// <summary>
/// 開発用：メールテンプレートプレビューエンドポイント
/// ブラウザでメールの表示を確認するためのコントローラー
/// </summary>
[ApiController]
[Route("api/dev/email-preview")]
[AllowAnonymous]
public class EmailPreviewController : ControllerBase
{
    private readonly ITemplateService _templateService;
    private readonly ILogger<EmailPreviewController> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public EmailPreviewController(
        ITemplateService templateService,
        ILogger<EmailPreviewController> logger
    )
    {
        _templateService = templateService;
        _logger = logger;
    }

    /// <summary>
    /// 利用可能なテンプレート一覧を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<EmailTemplateInfo>), StatusCodes.Status200OK)]
    public Ok<IReadOnlyList<EmailTemplateInfo>> ListTemplates()
    {
        return TypedResults.Ok(EmailPreviewDataFactory.GetTemplateList());
    }

    /// <summary>
    /// 指定したテンプレートのHTMLプレビューを取得
    /// ダミーデータを使用してレンダリング
    /// </summary>
    /// <param name="templateName">テンプレート名</param>
    [HttpGet("{templateName}")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK, "text/html")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status404NotFound)]
    public async Task<IResult> PreviewTemplate([FromRoute] string templateName)
    {
        var dummyData = EmailPreviewDataFactory.CreateDummyData(templateName);
        if (dummyData is null)
        {
            return TypedResults.NotFound(new MessageResponse
            {
                Message = $"テンプレート '{templateName}' が見つかりません。"
            });
        }

        var html = await RenderTemplateAsync(templateName, dummyData);
        if (html is null)
        {
            return TypedResults.BadRequest(new MessageResponse
            {
                Message = $"テンプレート '{templateName}' のレンダリングに失敗しました。"
            });
        }

        return TypedResults.Content(html, "text/html; charset=utf-8");
    }

    /// <summary>
    /// 指定したテンプレートのテキスト版プレビューを取得
    /// </summary>
    /// <param name="templateName">テンプレート名</param>
    [HttpGet("{templateName}/text")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK, "text/plain")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status404NotFound)]
    public async Task<IResult> PreviewTemplateText([FromRoute] string templateName)
    {
        var dummyData = EmailPreviewDataFactory.CreateDummyData(templateName);
        if (dummyData is null)
        {
            return TypedResults.NotFound(new MessageResponse
            {
                Message = $"テンプレート '{templateName}' が見つかりません。"
            });
        }

        var text = await RenderTextTemplateAsync(templateName, dummyData);
        if (text is null)
        {
            return TypedResults.BadRequest(new MessageResponse
            {
                Message = $"テンプレート '{templateName}' のテキスト版が見つからないか、レンダリングに失敗しました。"
            });
        }

        return TypedResults.Content(text, "text/plain; charset=utf-8");
    }

    /// <summary>
    /// プレビュー用の簡易インデックスページを返す
    /// </summary>
    [HttpGet("index")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK, "text/html")]
    public IResult Index()
    {
        var templates = EmailPreviewDataFactory.GetTemplateList();
        var listItems = string.Join("\n", templates.Select(t =>
            $"""
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><a href="/api/dev/email-preview/{t.Name}" target="_blank">{t.DisplayName}</a></td>
                <td style="padding: 8px; border: 1px solid #ddd;"><code>{t.Name}</code></td>
                <td style="padding: 8px; border: 1px solid #ddd;">{t.Description}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                    <a href="/api/dev/email-preview/{t.Name}" target="_blank">HTML</a> |
                    <a href="/api/dev/email-preview/{t.Name}/text" target="_blank">テキスト</a>
                </td>
            </tr>
            """
        ));

        var html = $$"""
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>メールテンプレートプレビュー</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    table { border-collapse: collapse; width: 100%; max-width: 1000px; }
                    th { background-color: #4a5568; color: white; padding: 12px 8px; text-align: left; }
                    tr:nth-child(even) { background-color: #f7fafc; }
                    a { color: #3182ce; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    code { background-color: #edf2f7; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
                    .note { color: #718096; font-size: 0.9em; margin-top: 20px; }
                </style>
            </head>
            <body>
                <h1>📧 メールテンプレートプレビュー</h1>
                <p>ダミーデータを使用したメールテンプレートのプレビューです。</p>
                <table>
                    <thead>
                        <tr>
                            <th>テンプレート名</th>
                            <th>識別子</th>
                            <th>説明</th>
                            <th>プレビュー</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{listItems}}
                    </tbody>
                </table>
                <p class="note">
                    ※ このページは開発・テスト環境専用です。<br>
                    ※ 表示されるデータはすべてダミーデータです。
                </p>
            </body>
            </html>
            """;

        return TypedResults.Content(html, "text/html; charset=utf-8");
    }

    private async Task<string?> RenderTemplateAsync(string templateName, object model)
    {
        try
        {
            var htmlTemplateName = $"{templateName}.html.cshtml";
            return await RenderWithModelAsync(htmlTemplateName, model);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "HTMLテンプレート {TemplateName} のレンダリングに失敗しました", templateName);
            return null;
        }
    }

    private async Task<string?> RenderTextTemplateAsync(string templateName, object model)
    {
        try
        {
            var textTemplateName = $"{templateName}.text.cshtml";
            return await RenderWithModelAsync(textTemplateName, model);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "テキストテンプレート {TemplateName} のレンダリングに失敗しました（存在しない可能性があります）", templateName);
            return null;
        }
    }

    private Task<string> RenderWithModelAsync(string templateName, object model)
    {
        var method = typeof(ITemplateService)
            .GetMethod(nameof(ITemplateService.RenderTemplateAsync))!
            .MakeGenericMethod(model.GetType());

        var task = (Task<string>)method.Invoke(_templateService, [templateName, model])!;
        return task;
    }
}
