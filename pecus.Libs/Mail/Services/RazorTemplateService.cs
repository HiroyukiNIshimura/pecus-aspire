using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.Mail.Configuration;
using RazorLight;
using System.IO;

namespace Pecus.Libs.Mail.Services;

/// <summary>
/// RazorLightを使用したテンプレートレンダリングサービス
/// </summary>
public class RazorTemplateService : ITemplateService
{
    private readonly IRazorLightEngine _razorEngine;
    private readonly EmailSettings _settings;
    private readonly ILogger<RazorTemplateService> _logger;

    public RazorTemplateService(
        IOptions<EmailSettings> settings,
        ILogger<RazorTemplateService> logger
    )
    {
        _settings = settings.Value;
        _logger = logger;

        // RazorLightエンジンの初期化
        var templateRootPath = Path.Combine(AppContext.BaseDirectory, _settings.TemplateRootPath);

        _logger.LogInformation("Initializing RazorLight with template root path: {TemplateRootPath}", templateRootPath);

        _razorEngine = new RazorLightEngineBuilder()
            .UseFileSystemProject(templateRootPath)
            .UseMemoryCachingProvider()
            .Build();
    }

    /// <summary>
    /// テンプレートをレンダリング
    /// </summary>
    public async Task<string> RenderTemplateAsync<TModel>(string templateName, TModel model)
    {
        try
        {
            _logger.LogDebug("Rendering template {TemplateName}", templateName);

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
