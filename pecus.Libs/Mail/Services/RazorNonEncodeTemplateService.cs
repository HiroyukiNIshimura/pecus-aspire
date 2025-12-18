using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.Mail.Configuration;
using RazorLight;

namespace Pecus.Libs.Mail.Services;

/// <summary>
/// RazorLightを使用したテンプレートレンダリングサービス
/// </summary>
public class RazorNonEncodeTemplateService : ITemplateService
{
    private readonly IRazorLightEngine _razorEngine;
    private readonly EmailSettings _settings;
    private readonly ILogger<RazorNonEncodeTemplateService> _logger;
    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="settings"></param>
    /// <param name="logger"></param>
    public RazorNonEncodeTemplateService(
        IOptions<EmailSettings> settings,
        ILogger<RazorNonEncodeTemplateService> logger
    )
    {
        _settings = settings.Value;
        _logger = logger;

        var templateRootPath = Path.Combine(AppContext.BaseDirectory, _settings.TemplateRootPath);

        // RazorLightエンジンの初期化
        _razorEngine = new RazorLightEngineBuilder()
            .UseFileSystemProject(templateRootPath)
            .UseMemoryCachingProvider()
            .DisableEncoding()
            .EnableDebugMode(false)
            .Build();
    }

    /// <summary>
    /// テンプレートをレンダリング
    /// </summary>
    public async Task<string> RenderTemplateAsync<TModel>(string templateName, TModel model)
    {
        try
        {
            var result = await _razorEngine.CompileRenderAsync(templateName, model);

            _logger.LogDebug("Template {TemplateName} rendered successfully", templateName);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to render template {TemplateName}", templateName);
            throw;
        }
    }
}