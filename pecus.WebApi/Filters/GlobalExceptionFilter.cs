using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Pecus.Exceptions;
using Pecus.Models.Responses.Common;

namespace Pecus.Filters;

/// <summary>
/// グローバルな例外ハンドリングフィルター
/// カスタム例外を統一的にエラーレスポンスに変換します
/// </summary>
public class GlobalExceptionFilter : IExceptionFilter
{
    private readonly ILogger<GlobalExceptionFilter> _logger;

    public GlobalExceptionFilter(ILogger<GlobalExceptionFilter> logger)
    {
        _logger = logger;
    }

    public void OnException(ExceptionContext context)
    {
        if (context.Exception is null)
            return;

        // ConcurrencyException<T> のジェネリック型をチェック
        var exceptionType = context.Exception.GetType();
        if (exceptionType.IsGenericType && exceptionType.GetGenericTypeDefinition() == typeof(ConcurrencyException<>))
        {
            context.Result = HandleConcurrencyExceptionDynamic(context.Exception, context);
            context.ExceptionHandled = true;
            return;
        }

        // 例外タイプごとにハンドリング
        var result = context.Exception switch
        {
            NotFoundException ex => HandleNotFoundException(ex, context),
            DuplicateException ex => HandleDuplicateException(ex, context),
            InvalidOperationException ex => HandleInvalidOperationException(ex, context),
            _ => HandleUnexpectedException(context.Exception, context),
        };

        context.Result = result;
        context.ExceptionHandled = true;
    }

    /// <summary>
    /// ConcurrencyException&lt;T&gt; の動的ハンドリング
    /// </summary>
    /// <param name="exception"></param>
    /// <param name="context"></param>
    private IActionResult HandleConcurrencyExceptionDynamic(Exception exception, ExceptionContext context)
    {
        var exceptionType = exception.GetType();
        var modelType = exceptionType.GetGenericArguments()[0];

        // Message と ConflictedModel プロパティを取得
        var messageProperty = exceptionType.GetProperty("Message", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
        var modelProperty = exceptionType.GetProperty("ConflictedModel", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);

        var message = messageProperty?.GetValue(exception) as string ?? "別のユーザーが同時に変更しました。";
        var conflictedModel = modelProperty?.GetValue(exception);

        _logger.LogWarning(
            "Concurrency Exception: {Message}, ConflictedModel: {@Model}",
            message,
            conflictedModel
        );

        // ConcurrencyErrorResponse<T> を動的に生成
        var responseType = typeof(ConcurrencyErrorResponse<>).MakeGenericType(modelType);
        var response = Activator.CreateInstance(responseType) as ErrorResponse;

        if (response != null)
        {
            response.StatusCode = StatusCodes.Status409Conflict;
            response.Message = message;

            // Current プロパティを設定
            var currentProperty = responseType.GetProperty("Current", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            currentProperty?.SetValue(response, conflictedModel);
        }

        return new ObjectResult(response)
        {
            StatusCode = StatusCodes.Status409Conflict,
        };
    }

    /// <summary>
    /// NotFoundException: 404 Not Found
    /// </summary>
    private IActionResult HandleNotFoundException(NotFoundException ex, ExceptionContext context)
    {
        _logger.LogWarning(
            "Not Found Exception: {Message}",
            ex.Message
        );

        return new ObjectResult(
            new ErrorResponse
            {
                StatusCode = StatusCodes.Status404NotFound,
                Message = ex.Message,
            }
        )
        {
            StatusCode = StatusCodes.Status404NotFound,
        };
    }

    /// <summary>
    /// DuplicateException: 400 Bad Request （重複データ）
    /// </summary>
    private IActionResult HandleDuplicateException(DuplicateException ex, ExceptionContext context)
    {
        _logger.LogWarning(
            "Duplicate Exception: {Message}",
            ex.Message
        );

        return new ObjectResult(
            new ErrorResponse
            {
                StatusCode = StatusCodes.Status400BadRequest,
                Message = ex.Message,
            }
        )
        {
            StatusCode = StatusCodes.Status400BadRequest,
        };
    }

    /// <summary>
    /// InvalidOperationException: 400 Bad Request （無効な操作）
    /// </summary>
    private IActionResult HandleInvalidOperationException(
        InvalidOperationException ex,
        ExceptionContext context
    )
    {
        _logger.LogWarning(
            "Invalid Operation Exception: {Message}",
            ex.Message
        );

        return new ObjectResult(
            new ErrorResponse
            {
                StatusCode = StatusCodes.Status400BadRequest,
                Message = ex.Message,
            }
        )
        {
            StatusCode = StatusCodes.Status400BadRequest,
        };
    }

    /// <summary>
    /// 予期しない例外: 500 Internal Server Error
    /// </summary>
    private IActionResult HandleUnexpectedException(
        Exception ex,
        ExceptionContext context
    )
    {
        _logger.LogError(
            ex,
            "Unexpected Exception: {Message}",
            ex.Message
        );

        return new ObjectResult(
            new ErrorResponse
            {
                StatusCode = StatusCodes.Status500InternalServerError,
                Message = "予期しないエラーが発生しました。",
            }
        )
        {
            StatusCode = StatusCodes.Status500InternalServerError,
        };
    }
}
