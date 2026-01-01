using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.Mail.Configuration;
using Pecus.Libs.Mail.Templates;
using RazorLight;

namespace Pecus.Libs.Mail.Services;

/// <summary>
/// RazorLightを使用したテンプレートレンダリングサービス
/// </summary>
public class RazorTemplateService : ITemplateService
{
    private readonly IRazorLightEngine _razorEngine;
    private readonly EmailSettings _settings;
    private readonly ApplicationSettings _appSettings;
    private readonly ILogger<RazorTemplateService> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public RazorTemplateService(
        IOptions<EmailSettings> settings,
        IOptions<ApplicationSettings> appSettings,
        ILogger<RazorTemplateService> logger
    )
    {
        _settings = settings.Value;
        _appSettings = appSettings.Value;
        _logger = logger;

        var templateRootPath = Path.Combine(AppContext.BaseDirectory, _settings.TemplateRootPath);

        // RazorLightエンジンの初期化
        _razorEngine = new RazorLightEngineBuilder()
            .UseFileSystemProject(templateRootPath)
            .UseMemoryCachingProvider()
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
            // モデルが EmailTemplateModelBase を継承している場合、App を自動注入
            if (model is EmailTemplateModelBase baseModel)
            {
                baseModel.App = AppSettings.FromApplicationSettings(_appSettings);
            }

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