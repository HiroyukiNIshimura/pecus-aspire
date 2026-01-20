using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Config;
using Pecus.Models.Requests.Agenda;
using Pecus.Models.Responses.Agenda;

namespace Pecus.Services;

public class AgendaService
{
    private readonly ApplicationDbContext _context;
    private readonly AgendaNotificationService _notificationService;
    private readonly ILogger<AgendaService> _logger;
    private readonly PecusConfig _config;

    public AgendaService(
        ApplicationDbContext context,
        AgendaNotificationService notificationService,
        ILogger<AgendaService> logger,
        PecusConfig config)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// アジェンダ一覧取得（期間指定）
    /// </summary>
    public async Task<List<AgendaResponse>> GetListAsync(int organizationId, DateTimeOffset start, DateTimeOffset end)
    {
        var query = _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.CancelledByUser)
            .Include(a => a.Attendees)
                .ThenInclude(at => at.User)
            .Where(a => a.OrganizationId == organizationId && a.StartAt < end && a.EndAt > start);

        var agendas = await query
            .OrderBy(a => a.StartAt)
            .ToListAsync();

        return agendas.Select(ToResponse).ToList();
    }

    /// <summary>
    /// 直近のアジェンダ一覧取得
    /// </summary>
    public async Task<List<AgendaResponse>> GetRecentListAsync(int organizationId, int limit = 20)
    {
        var now = DateTimeOffset.UtcNow;
        var query = _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.CancelledByUser)
            .Include(a => a.Attendees)
                .ThenInclude(at => at.User)
            .Where(a => a.OrganizationId == organizationId && a.EndAt > now);

        var agendas = await query
            .OrderBy(a => a.StartAt)
            .Take(limit)
            .ToListAsync();

        return agendas.Select(ToResponse).ToList();
    }

    /// <summary>
    /// アジェンダ詳細取得
    /// </summary>
    public async Task<AgendaResponse> GetByIdAsync(long id, int organizationId)
    {
        var query = _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.CancelledByUser)
            .Include(a => a.Attendees)
                .ThenInclude(at => at.User)
            .Where(a => a.Id == id && a.OrganizationId == organizationId);

        var agenda = await query.FirstOrDefaultAsync();

        if (agenda == null)
        {
            throw new NotFoundException("アジェンダが見つかりません。");
        }

        return ToResponse(agenda);
    }

    /// <summary>
    /// アジェンダの最大参加者数を取得
    /// </summary>
    /// <param name="organizationId"></param>
    /// <returns></returns>
    private int GetMaxAttendees(int organizationId)
    {
        var settings = _context.OrganizationSettings
            .AsNoTracking()
            .Where(o => o.Id == organizationId)
            .FirstOrDefault();

        if (settings == null)
        {
            throw new NotFoundException("組織設定が見つかりません。");
        }

        var limitsSettings = LimitsHelper.GetLimitsSettingsForPlan(
            _config.Limits,
            settings.Plan
        );

        return limitsSettings.MaxAttendeesPerAgenda;
    }

    /// <summary>
    /// アジェンダ作成（単発・繰り返しイベント対応）
    /// </summary>
    public async Task<AgendaResponse> CreateAsync(int organizationId, int userId, CreateAgendaRequest request)
    {
        if (request.EndAt <= request.StartAt)
        {
            throw new BadRequestException("終了日時は開始日時より後である必要があります。");
        }

        // 参加者数のバリデーション（作成者も含める）
        var maxAttendees = GetMaxAttendees(organizationId);
        var attendeeCount = (request.Attendees?.DistinctBy(a => a.UserId).Count(a => a.UserId != userId) ?? 0) + 1;
        if (attendeeCount > maxAttendees)
        {
            throw new BadRequestException($"参加者数は{maxAttendees}人以下にしてください。");
        }

        // 繰り返し設定のバリデーション
        var (isValid, errorMessage) = RecurrenceHelper.ValidateRecurrence(
            request.RecurrenceType,
            request.RecurrenceInterval,
            request.RecurrenceWeekOfMonth,
            request.RecurrenceEndDate,
            request.RecurrenceCount,
            request.StartAt);

        if (!isValid)
        {
            throw new BadRequestException(errorMessage!);
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var agenda = new Agenda
            {
                OrganizationId = organizationId,
                Title = request.Title,
                Description = request.Description,
                StartAt = request.StartAt,
                EndAt = request.EndAt,
                IsAllDay = request.IsAllDay,
                Location = request.Location,
                Url = request.Url,
                RecurrenceType = request.RecurrenceType,
                RecurrenceInterval = request.RecurrenceInterval,
                RecurrenceWeekOfMonth = request.RecurrenceWeekOfMonth,
                RecurrenceEndDate = request.RecurrenceEndDate,
                RecurrenceCount = request.RecurrenceCount,
                DefaultReminders = ConvertRemindersToString(request.Reminders),
                CreatedByUserId = userId
            };

            if (request.Attendees != null && request.Attendees.Count > 0)
            {
                // 重複排除
                var distinctAttendees = request.Attendees.DistinctBy(a => a.UserId);
                foreach (var reqAttendee in distinctAttendees)
                {
                    // 作成者は後で追加するのでスキップ
                    if (reqAttendee.UserId == userId) continue;

                    agenda.Attendees.Add(new AgendaAttendee
                    {
                        UserId = reqAttendee.UserId,
                        IsOptional = reqAttendee.IsOptional,
                        Status = AttendanceStatus.Pending
                    });
                }
            }

            // 作成者を参加者として追加（自動的にAccepted）
            agenda.Attendees.Add(new AgendaAttendee
            {
                UserId = userId,
                IsOptional = false,
                Status = AttendanceStatus.Accepted
            });

            _context.Agendas.Add(agenda);
            await _context.SaveChangesAsync();

            // 招待通知を作成（作成者自身は除外）
            if (request.SendNotification)
            {
                var attendeesToNotify = agenda.Attendees
                    .Where(a => a.UserId != userId) // 作成者自身は除外
                    .Select(a => a.UserId)
                    .ToList();

                if (attendeesToNotify.Count > 0)
                {
                    await _notificationService.CreateBulkNotificationsAsync(
                        agenda.Id,
                        attendeesToNotify,
                        AgendaNotificationType.Invited,
                        agenda.StartAt,
                        null,
                        userId);
                }
            }

            await transaction.CommitAsync();

            return await GetByIdAsync(agenda.Id, organizationId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// アジェンダ更新（シリーズ全体）
    /// </summary>
    public async Task<AgendaResponse> UpdateAsync(long id, int organizationId, UpdateAgendaRequest request)
    {
        if (request.EndAt <= request.StartAt)
        {
            throw new BadRequestException("終了日時は開始日時より後である必要があります。");
        }

        // 参加者数のバリデーション
        var maxAttendees = GetMaxAttendees(organizationId);
        var attendeeCount = request.Attendees?.DistinctBy(a => a.UserId).Count() ?? 0;
        if (attendeeCount > maxAttendees)
        {
            throw new BadRequestException($"参加者数は{maxAttendees}人以下にしてください。");
        }

        // 繰り返し設定のバリデーション
        var (isValid, errorMessage) = RecurrenceHelper.ValidateRecurrence(
            request.RecurrenceType,
            request.RecurrenceInterval,
            request.RecurrenceWeekOfMonth,
            request.RecurrenceEndDate,
            request.RecurrenceCount,
            request.StartAt);

        if (!isValid)
        {
            throw new BadRequestException(errorMessage!);
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var agenda = await _context.Agendas
                .Include(a => a.Attendees)
                .FirstOrDefaultAsync(a => a.Id == id && a.OrganizationId == organizationId);

            if (agenda == null)
                throw new NotFoundException("アジェンダが見つかりません。");

            if (agenda.IsCancelled)
                throw new BadRequestException("中止されたアジェンダは編集できません。");

            agenda.Title = request.Title;
            agenda.Description = request.Description;
            agenda.StartAt = request.StartAt;
            agenda.EndAt = request.EndAt;
            agenda.IsAllDay = request.IsAllDay;
            agenda.Location = request.Location;
            agenda.Url = request.Url;
            agenda.RecurrenceType = request.RecurrenceType;
            agenda.RecurrenceInterval = request.RecurrenceInterval;
            agenda.RecurrenceWeekOfMonth = request.RecurrenceWeekOfMonth;
            agenda.RecurrenceEndDate = request.RecurrenceEndDate;
            agenda.RecurrenceCount = request.RecurrenceCount;
            agenda.DefaultReminders = ConvertRemindersToString(request.Reminders);
            agenda.UpdatedAt = DateTimeOffset.UtcNow;

            // 参加者の更新（全量リストが送られてくる前提）
            var requestUserIds = request.Attendees?.Select(r => r.UserId).Distinct().ToList() ?? [];

            // 削除対象の参加者
            var toRemove = agenda.Attendees.Where(a => !requestUserIds.Contains(a.UserId)).ToList();
            foreach (var item in toRemove)
            {
                _context.AgendaAttendees.Remove(item);
            }

            // 更新/追加
            foreach (var reqAttendee in request.Attendees ?? [])
            {
                var existing = agenda.Attendees.FirstOrDefault(a => a.UserId == reqAttendee.UserId);
                if (existing != null)
                {
                    existing.IsOptional = reqAttendee.IsOptional;
                }
                else
                {
                    agenda.Attendees.Add(new AgendaAttendee
                    {
                        UserId = reqAttendee.UserId,
                        IsOptional = reqAttendee.IsOptional,
                        Status = AttendanceStatus.Pending
                    });
                }
            }

            // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
            _context.Entry(agenda).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return await GetByIdAsync(id, organizationId);
        }
        catch (DbUpdateConcurrencyException)
        {
            var latest = await GetByIdAsync(id, organizationId);
            throw new ConcurrencyException<AgendaResponse>("データが更新されています。再読み込みしてください。", latest);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// アジェンダ中止（シリーズ全体）
    /// </summary>
    public async Task<AgendaResponse> CancelAsync(long id, int organizationId, int userId, CancelAgendaRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var agenda = await _context.Agendas
                .Include(a => a.Attendees)
                .FirstOrDefaultAsync(a => a.Id == id && a.OrganizationId == organizationId);

            if (agenda == null)
                throw new NotFoundException("アジェンダが見つかりません。");

            if (agenda.IsCancelled)
                throw new BadRequestException("既に中止されています。");

            // 過去のイベントは中止不可
            if (agenda.EndAt < DateTimeOffset.UtcNow)
                throw new BadRequestException("過去のアジェンダは中止できません。");

            agenda.IsCancelled = true;
            agenda.CancellationReason = request.Reason;
            agenda.CancelledAt = DateTimeOffset.UtcNow;
            agenda.CancelledByUserId = userId;
            agenda.UpdatedAt = DateTimeOffset.UtcNow;

            // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
            _context.Entry(agenda).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

            await _context.SaveChangesAsync();

            // 中止通知を作成（中止した本人は除外）
            if (request.SendNotification)
            {
                var attendeesToNotify = agenda.Attendees
                    .Where(a => a.UserId != userId) // 中止した本人は除外
                    .Select(a => a.UserId)
                    .ToList();

                if (attendeesToNotify.Count > 0)
                {
                    await _notificationService.CreateBulkNotificationsAsync(
                        agenda.Id,
                        attendeesToNotify,
                        AgendaNotificationType.SeriesCancelled,
                        agenda.StartAt,
                        request.Reason,
                        userId);
                }
            }

            await transaction.CommitAsync();

            return await GetByIdAsync(id, organizationId);
        }
        catch (DbUpdateConcurrencyException)
        {
            var latest = await GetByIdAsync(id, organizationId);
            throw new ConcurrencyException<AgendaResponse>("データが更新されています。再読み込みしてください。", latest);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// 参加状況更新
    /// </summary>
    public async Task<AgendaResponse> UpdateAttendanceAsync(long agendaId, int organizationId, int userId, UpdateAttendanceRequest request)
    {
        var agenda = await _context.Agendas
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == agendaId && a.OrganizationId == organizationId);

        if (agenda == null)
            throw new NotFoundException("アジェンダが見つかりません。");

        if (agenda.IsCancelled)
            throw new BadRequestException("中止されたアジェンダの参加状況は変更できません。");

        var attendee = await _context.AgendaAttendees
            .FirstOrDefaultAsync(a => a.AgendaId == agendaId && a.UserId == userId);

        if (attendee == null)
            throw new BadRequestException("このアジェンダの参加者ではありません。");

        attendee.Status = request.Status;
        await _context.SaveChangesAsync();

        return await GetByIdAsync(agendaId, organizationId);
    }

    /// <summary>
    /// リマインダーリストを文字列に変換（カンマ区切り）
    /// </summary>
    private static string? ConvertRemindersToString(List<int>? reminders)
    {
        if (reminders == null || reminders.Count == 0) return null;
        return string.Join(",", reminders.Distinct().OrderByDescending(x => x));
    }

    /// <summary>
    /// リマインダー文字列をリストに変換
    /// </summary>
    private static List<int>? ParseRemindersFromString(string? reminders)
    {
        if (string.IsNullOrWhiteSpace(reminders)) return null;
        return reminders.Split(',')
            .Select(s => int.TryParse(s.Trim(), out var v) ? v : (int?)null)
            .Where(v => v.HasValue)
            .Select(v => v!.Value)
            .OrderByDescending(x => x)
            .ToList();
    }

    /// <summary>
    /// 展開済みオカレンス一覧取得（期間指定）
    /// 繰り返しイベントを展開し、例外（中止・変更）を反映した一覧を返す
    /// </summary>
    public async Task<List<AgendaOccurrenceResponse>> GetOccurrencesAsync(
        int organizationId,
        int currentUserId,
        DateTimeOffset start,
        DateTimeOffset end)
    {
        // 対象期間に開始日があるアジェンダ、または繰り返しで期間内にオカレンスがある可能性があるアジェンダを取得
        var agendas = await _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.Attendees)
            .Include(a => a.Exceptions)
            .Where(a => a.OrganizationId == organizationId)
            .Where(a =>
                // 単発イベント: 期間内に開始
                (a.RecurrenceType == null || a.RecurrenceType == RecurrenceType.None)
                    ? (a.StartAt < end && a.EndAt > start)
                    // 繰り返しイベント: 開始日が期間終了より前、かつ終了条件が期間開始より後（または無期限）
                    : (a.StartAt < end &&
                       (a.RecurrenceEndDate == null ||
                        a.RecurrenceEndDate >= DateOnly.FromDateTime(start.UtcDateTime))))
            .ToListAsync();

        var occurrences = new List<AgendaOccurrenceResponse>();
        var duration = TimeSpan.Zero;

        foreach (var agenda in agendas)
        {
            duration = agenda.EndAt - agenda.StartAt;
            var expandedDates = RecurrenceHelper.ExpandOccurrences(agenda, start, end);

            foreach (var occurrenceStart in expandedDates)
            {
                var occurrenceEnd = occurrenceStart + duration;

                // 例外（中止・変更）を確認
                var exception = agenda.Exceptions?
                    .FirstOrDefault(e => e.OriginalStartAt == occurrenceStart);

                // この回が中止されているか
                var isCancelled = agenda.IsCancelled || (exception?.IsCancelled ?? false);
                var cancellationReason = agenda.IsCancelled
                    ? agenda.CancellationReason
                    : exception?.CancellationReason;

                // 例外で変更されている場合はその値を使用
                var title = exception?.ModifiedTitle ?? agenda.Title;
                var location = exception?.ModifiedLocation ?? agenda.Location;
                var url = exception?.ModifiedUrl ?? agenda.Url;
                var actualStart = exception?.ModifiedStartAt ?? occurrenceStart;
                var actualEnd = exception?.ModifiedEndAt ?? occurrenceEnd;

                // 現在ユーザーの参加状況
                var myAttendance = agenda.Attendees?.FirstOrDefault(a => a.UserId == currentUserId);

                occurrences.Add(new AgendaOccurrenceResponse
                {
                    AgendaId = agenda.Id,
                    ExceptionId = exception?.Id,
                    StartAt = actualStart,
                    EndAt = actualEnd,
                    Title = title,
                    Location = location,
                    Url = url,
                    IsAllDay = agenda.IsAllDay,
                    RecurrenceType = agenda.RecurrenceType,
                    IsCancelled = isCancelled,
                    CancellationReason = cancellationReason,
                    IsModified = exception != null && !exception.IsCancelled,
                    AttendeeCount = agenda.Attendees?.Count ?? 0,
                    MyAttendanceStatus = myAttendance?.Status,
                    CreatedByUser = agenda.CreatedByUser == null ? null : ToUserItem(agenda.CreatedByUser)
                });
            }
        }

        // 開始日時でソート
        return occurrences.OrderBy(o => o.StartAt).ToList();
    }

    /// <summary>
    /// 直近の展開済みオカレンス一覧取得
    /// </summary>
    public async Task<List<AgendaOccurrenceResponse>> GetRecentOccurrencesAsync(
        int organizationId,
        int currentUserId,
        int limit = 20)
    {
        var result = await GetRecentOccurrencesPaginatedAsync(organizationId, currentUserId, limit, null);
        return result.Items;
    }

    /// <summary>
    /// 直近の展開済みオカレンス一覧取得（ページネーション対応）
    /// </summary>
    public async Task<AgendaOccurrencesResponse> GetRecentOccurrencesPaginatedAsync(
        int organizationId,
        int currentUserId,
        int limit = 20,
        DateTimeOffset? cursor = null)
    {
        var now = DateTimeOffset.UtcNow;
        // カーソルがある場合はその日時以降、なければ現在時刻以降
        var start = cursor ?? now;
        // 3ヶ月先まで展開して取得
        var end = start.AddMonths(3);

        var occurrences = await GetOccurrencesAsync(organizationId, currentUserId, start, end);

        // カーソルがある場合は、そのカーソル時刻より後のものだけにフィルター
        var filtered = cursor.HasValue
            ? occurrences.Where(o => o.StartAt > cursor.Value).ToList()
            : occurrences.Where(o => o.EndAt > now).ToList(); // 終了していないもののみ

        // limit + 1 件取得して、次ページがあるか判定
        var items = filtered.Take(limit).ToList();
        var hasMore = filtered.Count > limit;

        return new AgendaOccurrencesResponse
        {
            Items = items,
            NextCursor = hasMore ? items.LastOrDefault()?.StartAt : null
        };
    }

    // ===== 例外（特定回の中止・変更）関連メソッド =====

    /// <summary>
    /// アジェンダ例外作成（特定回の中止・変更）
    /// </summary>
    public async Task<AgendaExceptionResponse> CreateExceptionAsync(
        long agendaId,
        int organizationId,
        int userId,
        CreateAgendaExceptionRequest request)
    {
        var agenda = await _context.Agendas
            .Include(a => a.Exceptions)
            .Include(a => a.Attendees)
            .FirstOrDefaultAsync(a => a.Id == agendaId && a.OrganizationId == organizationId);

        if (agenda == null)
            throw new NotFoundException("アジェンダが見つかりません。");

        if (agenda.IsCancelled)
            throw new BadRequestException("中止されたアジェンダの例外は作成できません。");

        // 繰り返しイベントでない場合は例外を作成する必要がない
        if (agenda.RecurrenceType == null || agenda.RecurrenceType == RecurrenceType.None)
            throw new BadRequestException("単発イベントには例外を作成できません。シリーズ全体を編集してください。");

        // 対象の回が存在するか確認（展開して確認）
        var rangeEnd = request.OriginalStartAt.AddDays(1);
        var occurrences = RecurrenceHelper.ExpandOccurrences(agenda, request.OriginalStartAt, rangeEnd);
        if (!occurrences.Any(o => o == request.OriginalStartAt))
            throw new BadRequestException("指定された日時はこのアジェンダの繰り返し回ではありません。");

        // 同じ回の例外が既に存在するか確認
        var existingException = agenda.Exceptions?
            .FirstOrDefault(e => e.OriginalStartAt == request.OriginalStartAt);
        if (existingException != null)
            throw new BadRequestException("この回には既に例外が設定されています。更新を使用してください。");

        // 過去の回は変更不可
        if (request.OriginalStartAt < DateTimeOffset.UtcNow)
            throw new BadRequestException("過去の回は変更できません。");

        // バリデーション
        if (!request.IsCancelled && request.ModifiedEndAt.HasValue && request.ModifiedStartAt.HasValue)
        {
            if (request.ModifiedEndAt <= request.ModifiedStartAt)
                throw new BadRequestException("終了日時は開始日時より後である必要があります。");
        }

        var exception = new AgendaException
        {
            AgendaId = agendaId,
            OriginalStartAt = request.OriginalStartAt,
            IsCancelled = request.IsCancelled,
            CancellationReason = request.IsCancelled ? request.CancellationReason : null,
            ModifiedStartAt = request.IsCancelled ? null : request.ModifiedStartAt,
            ModifiedEndAt = request.IsCancelled ? null : request.ModifiedEndAt,
            ModifiedTitle = request.IsCancelled ? null : request.ModifiedTitle,
            ModifiedLocation = request.IsCancelled ? null : request.ModifiedLocation,
            ModifiedUrl = request.IsCancelled ? null : request.ModifiedUrl,
            ModifiedDescription = request.IsCancelled ? null : request.ModifiedDescription,
            CreatedByUserId = userId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.AgendaExceptions.Add(exception);
        await _context.SaveChangesAsync();

        // 特定回の中止・変更通知を作成（操作者自身は除外）
        if (request.SendNotification)
        {
            var attendeesToNotify = agenda.Attendees
                .Where(a => a.UserId != userId) // 操作者自身は除外
                .Select(a => a.UserId)
                .ToList();

            if (attendeesToNotify.Count > 0)
            {
                var notificationType = request.IsCancelled
                    ? AgendaNotificationType.OccurrenceCancelled
                    : AgendaNotificationType.OccurrenceUpdated;

                await _notificationService.CreateBulkNotificationsAsync(
                    agenda.Id,
                    attendeesToNotify,
                    notificationType,
                    request.OriginalStartAt,
                    request.IsCancelled ? request.CancellationReason : null,
                    userId);
            }
        }

        return await GetExceptionByIdAsync(exception.Id);
    }

    /// <summary>
    /// アジェンダ例外更新
    /// </summary>
    public async Task<AgendaExceptionResponse> UpdateExceptionAsync(
        long agendaId,
        long exceptionId,
        int organizationId,
        int userId,
        UpdateAgendaExceptionRequest request)
    {
        var agenda = await _context.Agendas
            .Include(a => a.Attendees)
            .FirstOrDefaultAsync(a => a.Id == agendaId && a.OrganizationId == organizationId);

        if (agenda == null)
            throw new NotFoundException("アジェンダが見つかりません。");

        var exception = await _context.AgendaExceptions
            .FirstOrDefaultAsync(e => e.Id == exceptionId && e.AgendaId == agendaId);

        if (exception == null)
            throw new NotFoundException("アジェンダ例外が見つかりません。");

        // 過去の回は変更不可
        if (exception.OriginalStartAt < DateTimeOffset.UtcNow)
            throw new BadRequestException("過去の回は変更できません。");

        // バリデーション
        if (!request.IsCancelled && request.ModifiedEndAt.HasValue && request.ModifiedStartAt.HasValue)
        {
            if (request.ModifiedEndAt <= request.ModifiedStartAt)
                throw new BadRequestException("終了日時は開始日時より後である必要があります。");
        }

        exception.IsCancelled = request.IsCancelled;
        exception.CancellationReason = request.IsCancelled ? request.CancellationReason : null;
        exception.ModifiedStartAt = request.IsCancelled ? null : request.ModifiedStartAt;
        exception.ModifiedEndAt = request.IsCancelled ? null : request.ModifiedEndAt;
        exception.ModifiedTitle = request.IsCancelled ? null : request.ModifiedTitle;
        exception.ModifiedLocation = request.IsCancelled ? null : request.ModifiedLocation;
        exception.ModifiedUrl = request.IsCancelled ? null : request.ModifiedUrl;
        exception.ModifiedDescription = request.IsCancelled ? null : request.ModifiedDescription;

        await _context.SaveChangesAsync();

        // 特定回の中止・変更通知を作成（操作者自身は除外）
        if (request.SendNotification)
        {
            var attendeesToNotify = agenda.Attendees
                .Where(a => a.UserId != userId) // 操作者自身は除外
                .Select(a => a.UserId)
                .ToList();

            if (attendeesToNotify.Count > 0)
            {
                var notificationType = request.IsCancelled
                    ? AgendaNotificationType.OccurrenceCancelled
                    : AgendaNotificationType.OccurrenceUpdated;

                await _notificationService.CreateBulkNotificationsAsync(
                    agenda.Id,
                    attendeesToNotify,
                    notificationType,
                    exception.OriginalStartAt,
                    request.IsCancelled ? request.CancellationReason : null,
                    userId);
            }
        }

        return await GetExceptionByIdAsync(exceptionId);
    }

    /// <summary>
    /// アジェンダ例外削除（特定回の中止・変更を取消）
    /// </summary>
    public async Task DeleteExceptionAsync(
        long agendaId,
        long exceptionId,
        int organizationId)
    {
        var agenda = await _context.Agendas
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == agendaId && a.OrganizationId == organizationId);

        if (agenda == null)
            throw new NotFoundException("アジェンダが見つかりません。");

        var exception = await _context.AgendaExceptions
            .FirstOrDefaultAsync(e => e.Id == exceptionId && e.AgendaId == agendaId);

        if (exception == null)
            throw new NotFoundException("アジェンダ例外が見つかりません。");

        // 過去の回は変更不可
        if (exception.OriginalStartAt < DateTimeOffset.UtcNow)
            throw new BadRequestException("過去の回の例外は削除できません。");

        _context.AgendaExceptions.Remove(exception);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// アジェンダ例外一覧取得
    /// </summary>
    public async Task<List<AgendaExceptionResponse>> GetExceptionsAsync(long agendaId, int organizationId)
    {
        var agenda = await _context.Agendas
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == agendaId && a.OrganizationId == organizationId);

        if (agenda == null)
            throw new NotFoundException("アジェンダが見つかりません。");

        var exceptions = await _context.AgendaExceptions
            .AsNoTracking()
            .Include(e => e.CreatedByUser)
            .Where(e => e.AgendaId == agendaId)
            .OrderBy(e => e.OriginalStartAt)
            .ToListAsync();

        return exceptions.Select(ToExceptionResponse).ToList();
    }

    /// <summary>
    /// アジェンダ例外詳細取得
    /// </summary>
    private async Task<AgendaExceptionResponse> GetExceptionByIdAsync(long exceptionId)
    {
        var exception = await _context.AgendaExceptions
            .AsNoTracking()
            .Include(e => e.CreatedByUser)
            .FirstOrDefaultAsync(e => e.Id == exceptionId);

        if (exception == null)
            throw new NotFoundException("アジェンダ例外が見つかりません。");

        return ToExceptionResponse(exception);
    }

    private AgendaExceptionResponse ToExceptionResponse(AgendaException exception)
    {
        return new AgendaExceptionResponse
        {
            Id = exception.Id,
            AgendaId = exception.AgendaId,
            OriginalStartAt = exception.OriginalStartAt,
            IsCancelled = exception.IsCancelled,
            CancellationReason = exception.CancellationReason,
            ModifiedStartAt = exception.ModifiedStartAt,
            ModifiedEndAt = exception.ModifiedEndAt,
            ModifiedTitle = exception.ModifiedTitle,
            ModifiedLocation = exception.ModifiedLocation,
            ModifiedUrl = exception.ModifiedUrl,
            ModifiedDescription = exception.ModifiedDescription,
            CreatedAt = exception.CreatedAt,
            CreatedByUser = exception.CreatedByUser == null ? null : ToUserItem(exception.CreatedByUser)
        };
    }

    // ===== 「この回以降」更新（シリーズ分割）関連メソッド =====

    /// <summary>
    /// 「この回以降」更新（シリーズ分割）
    /// </summary>
    /// <remarks>
    /// 指定された回を境にシリーズを分割します。
    /// 元のシリーズは分割地点の前の回で終了し、新しいシリーズが作成されます。
    /// 分割地点以降の例外は新しいシリーズに移行されます。
    /// </remarks>
    public async Task<AgendaResponse> UpdateFromOccurrenceAsync(
        long agendaId,
        int organizationId,
        int userId,
        UpdateFromOccurrenceRequest request)
    {
        if (request.EndAt <= request.StartAt)
            throw new BadRequestException("終了日時は開始日時より後である必要があります。");

        // 繰り返し設定のバリデーション
        var (isValid, errorMessage) = RecurrenceHelper.ValidateRecurrence(
            request.RecurrenceType,
            request.RecurrenceInterval,
            request.RecurrenceWeekOfMonth,
            request.RecurrenceEndDate,
            request.RecurrenceCount,
            request.StartAt);

        if (!isValid)
            throw new BadRequestException(errorMessage!);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var originalAgenda = await _context.Agendas
                .Include(a => a.Attendees)
                .Include(a => a.Exceptions)
                .FirstOrDefaultAsync(a => a.Id == agendaId && a.OrganizationId == organizationId);

            if (originalAgenda == null)
                throw new NotFoundException("アジェンダが見つかりません。");

            if (originalAgenda.IsCancelled)
                throw new BadRequestException("中止されたアジェンダは編集できません。");

            // 繰り返しイベントでない場合はシリーズ分割は不要
            if (originalAgenda.RecurrenceType == null || originalAgenda.RecurrenceType == RecurrenceType.None)
                throw new BadRequestException("単発イベントにはこの操作は使用できません。通常の更新を使用してください。");

            // 分割地点が繰り返しの回に存在するか確認
            var rangeEnd = request.FromStartAt.AddDays(1);
            var occurrences = RecurrenceHelper.ExpandOccurrences(originalAgenda, request.FromStartAt, rangeEnd);
            if (!occurrences.Any(o => o == request.FromStartAt))
                throw new BadRequestException("指定された日時はこのアジェンダの繰り返し回ではありません。");

            // 過去の回からの分割は不可
            if (request.FromStartAt < DateTimeOffset.UtcNow)
                throw new BadRequestException("過去の回からの分割はできません。");

            // 最初の回で分割しようとした場合は通常の更新を使用すべき
            if (request.FromStartAt == originalAgenda.StartAt)
                throw new BadRequestException("最初の回からの分割はできません。シリーズ全体の更新を使用してください。");

            // ===== 元のシリーズを分割地点の前日で終了 =====
            // 分割地点の1つ前の回を見つける
            var previousOccurrenceEnd = FindPreviousOccurrenceDate(originalAgenda, request.FromStartAt);
            if (previousOccurrenceEnd == null)
                throw new BadRequestException("分割地点より前の回が見つかりません。");

            originalAgenda.RecurrenceEndDate = DateOnly.FromDateTime(previousOccurrenceEnd.Value.UtcDateTime);
            originalAgenda.RecurrenceCount = null; // 終了日指定に切り替え
            originalAgenda.UpdatedAt = DateTimeOffset.UtcNow;

            // ===== 新しいシリーズを作成 =====
            var newAgenda = new Agenda
            {
                OrganizationId = organizationId,
                Title = request.Title,
                Description = request.Description,
                StartAt = request.StartAt,
                EndAt = request.EndAt,
                IsAllDay = request.IsAllDay,
                Location = request.Location,
                Url = request.Url,
                RecurrenceType = request.RecurrenceType,
                RecurrenceInterval = request.RecurrenceInterval,
                RecurrenceWeekOfMonth = request.RecurrenceWeekOfMonth,
                RecurrenceEndDate = request.RecurrenceEndDate,
                RecurrenceCount = request.RecurrenceCount,
                DefaultReminders = ConvertRemindersToString(request.Reminders),
                CreatedByUserId = userId
            };

            // 参加者を引き継ぎまたは指定
            var attendeesToAdd = request.Attendees ?? originalAgenda.Attendees
                .Select(a => new AgendaAttendeeRequest
                {
                    UserId = a.UserId,
                    IsOptional = a.IsOptional
                })
                .ToList();

            foreach (var reqAttendee in attendeesToAdd.DistinctBy(a => a.UserId))
            {
                // 元のシリーズでの参加状況を引き継ぎ
                var originalAttendee = originalAgenda.Attendees
                    .FirstOrDefault(a => a.UserId == reqAttendee.UserId);

                newAgenda.Attendees.Add(new AgendaAttendee
                {
                    UserId = reqAttendee.UserId,
                    IsOptional = reqAttendee.IsOptional,
                    Status = originalAttendee?.Status ?? AttendanceStatus.Pending,
                    CustomReminders = originalAttendee?.CustomReminders
                });
            }

            _context.Agendas.Add(newAgenda);
            await _context.SaveChangesAsync();

            // ===== 分割地点以降の例外を新しいシリーズに移行 =====
            var exceptionsToMove = originalAgenda.Exceptions?
                .Where(e => e.OriginalStartAt >= request.FromStartAt)
                .ToList() ?? new List<AgendaException>();

            foreach (var exception in exceptionsToMove)
            {
                // 新しいシリーズに例外をコピー
                var newException = new AgendaException
                {
                    AgendaId = newAgenda.Id,
                    OriginalStartAt = exception.OriginalStartAt,
                    IsCancelled = exception.IsCancelled,
                    CancellationReason = exception.CancellationReason,
                    ModifiedStartAt = exception.ModifiedStartAt,
                    ModifiedEndAt = exception.ModifiedEndAt,
                    ModifiedTitle = exception.ModifiedTitle,
                    ModifiedLocation = exception.ModifiedLocation,
                    ModifiedUrl = exception.ModifiedUrl,
                    ModifiedDescription = exception.ModifiedDescription,
                    CreatedByUserId = exception.CreatedByUserId,
                    CreatedAt = exception.CreatedAt
                };
                _context.AgendaExceptions.Add(newException);

                // 元のシリーズから例外を削除
                _context.AgendaExceptions.Remove(exception);
            }

            await _context.SaveChangesAsync();

            // シリーズ更新通知を作成（操作者自身は除外）
            if (request.SendNotification)
            {
                var attendeesToNotify = newAgenda.Attendees
                    .Where(a => a.UserId != userId) // 操作者自身は除外
                    .Select(a => a.UserId)
                    .ToList();

                if (attendeesToNotify.Count > 0)
                {
                    await _notificationService.CreateBulkNotificationsAsync(
                        newAgenda.Id,
                        attendeesToNotify,
                        AgendaNotificationType.SeriesUpdated,
                        request.FromStartAt,
                        $"{request.FromStartAt:yyyy/MM/dd}以降のイベントが変更されました",
                        userId);
                }
            }

            await transaction.CommitAsync();

            return await GetByIdAsync(newAgenda.Id, organizationId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// 指定された日時より前の直近のオカレンス日時を取得
    /// </summary>
    private DateTimeOffset? FindPreviousOccurrenceDate(Agenda agenda, DateTimeOffset targetDate)
    {
        // 開始日から対象日時までを展開
        var occurrences = RecurrenceHelper.ExpandOccurrences(agenda, agenda.StartAt, targetDate);

        // 対象日時より前の最後のオカレンスを取得
        return occurrences
            .Where(o => o < targetDate)
            .OrderByDescending(o => o)
            .Cast<DateTimeOffset?>()
            .FirstOrDefault();
    }

    private AgendaResponse ToResponse(Agenda agenda)
    {
        return new AgendaResponse
        {
            Id = agenda.Id,
            OrganizationId = agenda.OrganizationId,
            Title = agenda.Title,
            Description = agenda.Description,
            StartAt = agenda.StartAt,
            EndAt = agenda.EndAt,
            IsAllDay = agenda.IsAllDay,
            Location = agenda.Location,
            Url = agenda.Url,
            RecurrenceType = agenda.RecurrenceType,
            RecurrenceInterval = agenda.RecurrenceInterval,
            RecurrenceWeekOfMonth = agenda.RecurrenceWeekOfMonth,
            RecurrenceEndDate = agenda.RecurrenceEndDate,
            RecurrenceCount = agenda.RecurrenceCount,
            Reminders = ParseRemindersFromString(agenda.DefaultReminders),
            IsCancelled = agenda.IsCancelled,
            CancellationReason = agenda.CancellationReason,
            CancelledAt = agenda.CancelledAt,
            CancelledByUser = agenda.CancelledByUser == null ? null : ToUserItem(agenda.CancelledByUser),
            CreatedByUserId = agenda.CreatedByUserId,
            CreatedAt = agenda.CreatedAt,
            UpdatedAt = agenda.UpdatedAt,
            RowVersion = agenda.RowVersion,
            CreatedByUser = agenda.CreatedByUser == null ? null : ToUserItem(agenda.CreatedByUser),
            Attendees = agenda.Attendees.Select(a => new AgendaAttendeeResponse
            {
                UserId = a.UserId,
                Status = a.Status,
                IsOptional = a.IsOptional,
                CustomReminders = ParseRemindersFromString(a.CustomReminders),
                User = a.User == null ? null : ToUserItem(a.User)
            }).OrderBy(a => a.User?.Username).ToList()
        };
    }

    private UserItem ToUserItem(User user)
    {
        return new UserItem
        {
            Id = user.Id,
            LoginId = user.LoginId,
            Username = user.Username,
            Email = user.Email,
            AvatarType = user.AvatarType?.ToString() ?? "auto-generated",
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(user.AvatarType, user.Id, user.Username, user.Email, user.UserAvatarPath),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            RoleCount = 0
        };
    }
}
