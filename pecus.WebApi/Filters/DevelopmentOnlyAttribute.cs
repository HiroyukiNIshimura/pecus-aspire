using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Hosting;

namespace Pecus.Filters;

/// <summary>
/// 開発環境でのみアクションを実行し、それ以外の環境では404を返します。
/// </summary>
[AttributeUsage(AttributeTargets.Class, Inherited = true, AllowMultiple = false)]
public sealed class DevelopmentOnlyAttribute : TypeFilterAttribute
{
    public DevelopmentOnlyAttribute()
        : base(typeof(DevelopmentOnlyFilter)) { }
}

public sealed class DevelopmentOnlyFilter : IActionFilter
{
    private readonly IHostEnvironment _hostEnvironment;

    public DevelopmentOnlyFilter(IHostEnvironment hostEnvironment)
    {
        _hostEnvironment = hostEnvironment;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!_hostEnvironment.IsDevelopment())
        {
            context.Result = new NotFoundResult();
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}