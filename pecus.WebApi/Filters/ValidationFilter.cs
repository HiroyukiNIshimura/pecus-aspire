using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Pecus.Models.Responses.Common;

namespace Pecus.Filters;

/// <summary>
/// リクエストの検証を行うアクションフィルター
/// </summary>
public class ValidationFilter : IActionFilter
{
    /// <summary>
    /// アクション実行前の処理
    /// </summary>
    public void OnActionExecuting(ActionExecutingContext context)
    {
        // ModelStateが無効な場合
        if (!context.ModelState.IsValid)
        {
            var errors = context
                .ModelState.Where(x => x.Value?.Errors.Count > 0)
                .SelectMany(x =>
                    x.Value!.Errors.Select(e => new
                    {
                        Field = x.Key,
                        Message = string.IsNullOrEmpty(e.ErrorMessage)
                            ? e.Exception?.Message
                            : e.ErrorMessage,
                    })
                )
                .ToList();

            var errorMessage = string.Join(", ", errors.Select(e => $"{e.Field}: {e.Message}"));

            var response = new ErrorResponse
            {
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "リクエストの検証に失敗しました。",
            };

            if (!string.IsNullOrEmpty(errorMessage))
            {
                response.Details = errorMessage;
            }

            context.Result = new BadRequestObjectResult(response);
        }
    }

    /// <summary>
    /// アクション実行後の処理
    /// </summary>
    public void OnActionExecuted(ActionExecutedContext context)
    {
        // 何もしない
    }
}