namespace Pecus.Libs.Mail.Services;

/// <summary>
/// テンプレートレンダリングサービスのインターフェース
/// </summary>
public interface ITemplateService
{
    /// <summary>
    /// テンプレートをレンダリング
    /// </summary>
    /// <typeparam name="TModel">モデルの型</typeparam>
    /// <param name="templateName">テンプレート名</param>
    /// <param name="model">テンプレートにバインドするモデル</param>
    /// <returns>レンダリングされた文字列</returns>
    Task<string> RenderTemplateAsync<TModel>(string templateName, TModel model);
}
