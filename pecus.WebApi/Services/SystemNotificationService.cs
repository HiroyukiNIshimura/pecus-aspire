using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.BackOffice;
using Pecus.Models.Responses.BackOffice;
using Pecus.Models.Responses.Common;
using System.Text.Json;

namespace Pecus.Services;

/// <summary>
/// システム通知管理サービス
/// </summary>
public class SystemNotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SystemNotificationService> _logger;

    public SystemNotificationService(
        ApplicationDbContext context,
        ILogger<SystemNotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// システム通知一覧を取得
    /// </summary>
    public async Task<PagedResponse<BackOfficeNotificationListItemResponse>> GetNotificationsAsync(
        BackOfficeGetNotificationsRequest request)
    {
        var query = _context.SystemNotifications
            .AsNoTracking()
            .Include(n => n.CreatedByUser)
            .AsQueryable();

        if (!request.IncludeDeleted)
        {
            query = query.Where(n => !n.IsDeleted);
        }

        var totalCount = await query.CountAsync();

        var notifications = await query
            .OrderByDescending(n => n.PublishAt)
            .ThenByDescending(n => n.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(n => new BackOfficeNotificationListItemResponse
            {
                Id = n.Id,
                Subject = n.Subject,
                Type = n.Type,
                PublishAt = n.PublishAt,
                EndAt = n.EndAt,
                IsProcessed = n.IsProcessed,
                ProcessedAt = n.ProcessedAt,
                IsDeleted = n.IsDeleted,
                CreatedAt = n.CreatedAt,
                CreatedByUserName = n.CreatedByUser != null ? n.CreatedByUser.Username : null,
                RowVersion = n.RowVersion,
            })
            .ToListAsync();

        var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

        return new PagedResponse<BackOfficeNotificationListItemResponse>
        {
            Data = notifications,
            TotalCount = totalCount,
            CurrentPage = request.Page,
            PageSize = request.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = request.Page > 1,
            HasNextPage = request.Page < totalPages,
        };
    }

    /// <summary>
    /// システム通知詳細を取得
    /// </summary>
    public async Task<BackOfficeNotificationDetailResponse> GetNotificationAsync(int id)
    {
        var notification = await _context.SystemNotifications
            .AsNoTracking()
            .Include(n => n.CreatedByUser)
            .Include(n => n.UpdatedByUser)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (notification == null)
        {
            throw new NotFoundException("システム通知が見つかりません。");
        }

        return MapToDetailResponse(notification);
    }

    /// <summary>
    /// システム通知を作成
    /// </summary>
    public async Task<BackOfficeNotificationDetailResponse> CreateNotificationAsync(
        BackOfficeCreateNotificationRequest request,
        int createdByUserId)
    {
        var notification = new SystemNotification
        {
            Subject = request.Subject,
            Body = request.Body,
            Type = request.Type,
            PublishAt = request.PublishAt,
            EndAt = request.EndAt,
            IsProcessed = false,
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedByUserId = createdByUserId,
        };

        _context.SystemNotifications.Add(notification);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "システム通知を作成しました: NotificationId={NotificationId}, Subject={Subject}",
            notification.Id,
            notification.Subject);

        return await GetNotificationAsync(notification.Id);
    }

    /// <summary>
    /// システム通知を更新（公開前のみ）
    /// </summary>
    public async Task<BackOfficeNotificationDetailResponse> UpdateNotificationAsync(
        int id,
        BackOfficeUpdateNotificationRequest request,
        int updatedByUserId)
    {
        var notification = await _context.SystemNotifications
            .FirstOrDefaultAsync(n => n.Id == id);

        if (notification == null)
        {
            throw new NotFoundException("システム通知が見つかりません。");
        }

        if (notification.IsProcessed)
        {
            throw new BadRequestException("配信済みの通知は編集できません。");
        }

        if (notification.PublishAt <= DateTimeOffset.UtcNow)
        {
            throw new BadRequestException("公開日時を過ぎた通知は編集できません。");
        }

        if (request.Subject != null)
        {
            notification.Subject = request.Subject;
        }

        if (request.Body != null)
        {
            notification.Body = request.Body;
        }

        if (request.Type.HasValue)
        {
            notification.Type = request.Type.Value;
        }

        if (request.PublishAt.HasValue)
        {
            notification.PublishAt = request.PublishAt.Value;
        }

        if (request.EndAt.HasValue)
        {
            notification.EndAt = request.EndAt.Value;
        }

        notification.UpdatedAt = DateTimeOffset.UtcNow;
        notification.UpdatedByUserId = updatedByUserId;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            var latest = await _context.SystemNotifications
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.Id == id);
            throw new BadRequestException(
                "システム通知は他のユーザーによって更新されました。最新のデータを確認してください。");
        }

        _logger.LogInformation(
            "システム通知を更新しました: NotificationId={NotificationId}",
            id);

        return await GetNotificationAsync(id);
    }

    /// <summary>
    /// システム通知を削除（論理削除＋配信済みメッセージ削除）
    /// </summary>
    public async Task DeleteNotificationAsync(
        int id,
        BackOfficeDeleteNotificationRequest request)
    {
        var notification = await _context.SystemNotifications
            .FirstOrDefaultAsync(n => n.Id == id);

        if (notification == null)
        {
            throw new NotFoundException("システム通知が見つかりません。");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            if (request.DeleteMessages && !string.IsNullOrEmpty(notification.MessageIds))
            {
                var messageIds = JsonSerializer.Deserialize<List<int>>(notification.MessageIds);
                if (messageIds != null && messageIds.Count > 0)
                {
                    await _context.ChatMessages
                        .Where(m => messageIds.Contains(m.Id))
                        .ExecuteDeleteAsync();

                    _logger.LogInformation(
                        "配信済みメッセージを削除しました: NotificationId={NotificationId}, MessageCount={MessageCount}",
                        id,
                        messageIds.Count);
                }
            }

            notification.IsDeleted = true;
            notification.DeletedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation(
                "システム通知を削除しました: NotificationId={NotificationId}",
                id);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();
            throw new BadRequestException(
                "システム通知は他のユーザーによって更新されました。最新のデータを確認してください。");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "システム通知の削除に失敗しました: NotificationId={NotificationId}", id);
            throw;
        }
    }

    private static BackOfficeNotificationDetailResponse MapToDetailResponse(SystemNotification notification)
    {
        var now = DateTimeOffset.UtcNow;
        var isEditable = !notification.IsProcessed && notification.PublishAt > now && !notification.IsDeleted;

        return new BackOfficeNotificationDetailResponse
        {
            Id = notification.Id,
            Subject = notification.Subject,
            Body = notification.Body,
            Type = notification.Type,
            PublishAt = notification.PublishAt,
            EndAt = notification.EndAt,
            IsProcessed = notification.IsProcessed,
            ProcessedAt = notification.ProcessedAt,
            MessageIds = notification.MessageIds,
            IsDeleted = notification.IsDeleted,
            DeletedAt = notification.DeletedAt,
            CreatedAt = notification.CreatedAt,
            CreatedByUserId = notification.CreatedByUserId,
            CreatedByUserName = notification.CreatedByUser?.Username,
            UpdatedAt = notification.UpdatedAt,
            UpdatedByUserId = notification.UpdatedByUserId,
            UpdatedByUserName = notification.UpdatedByUser?.Username,
            IsEditable = isEditable,
            RowVersion = notification.RowVersion,
        };
    }
}
