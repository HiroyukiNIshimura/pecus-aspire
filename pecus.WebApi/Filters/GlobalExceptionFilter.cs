using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Pecus.Exceptions;

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

        // IConcurrencyException インターフェースで型安全に処理
        if (context.Exception is IConcurrencyException concurrencyEx)
        {
            context.Result = HandleConcurrencyException(concurrencyEx, context);
            context.ExceptionHandled = true;
            return;
        }

        // 例外タイプごとにハンドリング
        var result = context.Exception switch
        {
            UnauthorizedException ex => HandleUnauthorizedException(ex, context),
            NotFoundException ex => HandleNotFoundException(ex, context),
            BadRequestException ex => HandleBadRequestException(ex, context),
            DuplicateException ex => HandleDuplicateException(ex, context),
            InvalidOperationException ex => HandleInvalidOperationException(ex, context),
            _ => HandleUnexpectedException(context.Exception, context),
        };

        context.Result = result;
        context.ExceptionHandled = true;
    }

    /// <summary>
    /// ConcurrencyException のハンドリング（インターフェース経由）
    /// </summary>
    private IActionResult HandleConcurrencyException(IConcurrencyException ex, ExceptionContext context)
    {
        _logger.LogWarning(
            "Concurrency Exception: {Message}, ConflictedModel: {@Model}",
            ex.Message,
            ex.ConflictedModel
        );

        var response = new ConcurrencyErrorResponse<IConflictModel>
        {
            StatusCode = StatusCodes.Status409Conflict,
            Message = ex.Message,
            Current = ex.ConflictedModel as IConflictModel,
        };

        return new ObjectResult(response)
        {
            StatusCode = StatusCodes.Status409Conflict,
        };
    }

    /// <summary>
    /// UnauthorizedException: 401 Unauthorized
    /// </summary>
    private IActionResult HandleUnauthorizedException(UnauthorizedException ex, ExceptionContext context)
    {
        _logger.LogWarning(
            "Unauthorized Exception: {Message}",
            ex.Message
        );

        return new ObjectResult(
            new ErrorResponse
            {
                StatusCode = StatusCodes.Status401Unauthorized,
                Message = ex.Message,
            }
        )
        {
            StatusCode = StatusCodes.Status401Unauthorized,
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
    /// BadRequestException: 400 Bad Request （不正なリクエスト）
    /// </summary>
    private IActionResult HandleBadRequestException(BadRequestException ex, ExceptionContext context)
    {
        _logger.LogWarning(
            "Bad Request Exception: {Message}",
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