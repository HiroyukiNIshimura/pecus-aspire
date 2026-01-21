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
    /// <param name="organizationId">組織ID</param>
    /// <param name="userId">ユーザーID（このユーザーが参加者のアジェンダのみ返す）</param>
    /// <param name="start">開始日時</param>
    /// <param name="end">終了日時</param>
    public async Task<List<AgendaResponse>> GetListAsync(int organizationId, int userId, DateTimeOffset start, DateTimeOffset end)
    {
        var query = _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.CancelledByUser)
            .Include(a => a.Attendees)
                .ThenInclude(at => at.User)
            .Where(a => a.OrganizationId == organizationId
                && a.StartAt < end
                && a.EndAt > start
                && a.Attendees.Any(at => at.UserId == userId)); // 自分が参加者のみ

        var agendas = await query
            .OrderBy(a => a.StartAt)
            .ToListAsync();

        return agendas.Select(a => ToResponse(a)).ToList();
    }

    /// <summary>
    /// 直近のアジェンダ一覧取得
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="userId">ユーザーID（このユーザーが参加者のアジェンダのみ返す）</param>
    /// <param name="limit">取得件数</param>
    public async Task<List<AgendaResponse>> GetRecentListAsync(int organizationId, int userId, int limit = 20)
    {
        var now = DateTimeOffset.UtcNow;
        var query = _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.CancelledByUser)
            .Include(a => a.Attendees)
                .ThenInclude(at => at.User)
            .Where(a => a.OrganizationId == organizationId
                && a.EndAt > now
                && a.Attendees.Any(at => at.UserId == userId)); // 自分が参加者のみ

        var agendas = await query
            .OrderBy(a => a.StartAt)
            .Take(limit)
            .ToListAsync();

        return agendas.Select(a => ToResponse(a)).ToList();
    }

    /// <summary>
    /// アジェンダ詳細取得
    /// </summary>
    /// <param name="id">アジェンダID</param>
    /// <param name="organizationId">組織ID</param>
    /// <param name="occurrenceIndex">特定回のインデックス（指定すると例外情報を適用した値を返す）</param>
    public async Task<AgendaResponse> GetByIdAsync(long id, int organizationId, int? occurrenceIndex = null)
    {
        var query = _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.CancelledByUser)
            .Include(a => a.Attendees)
                .ThenInclude(at => at.User)
            .Include(a => a.AttendanceResponses)
            .Include(a => a.Exceptions)
            .Where(a => a.Id == id && a.OrganizationId == organizationId);

        var agenda = await query.FirstOrDefaultAsync();

        if (agenda == null)
        {
            throw new NotFoundException("アジェンダが見つかりません。");
        }

        return ToResponse(agenda, occurrenceIndex);
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
            .Where(o => o.OrganizationId == organizationId)
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
                        IsOptional = reqAttendee.IsOptional
                    });
                }
            }

            // 作成者を参加者として追加
            agenda.Attendees.Add(new AgendaAttendee
            {
                UserId = userId,
                IsOptional = false
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
    public async Task<AgendaResponse> UpdateAsync(long id, int organizationId, int userId, UpdateAgendaRequest request)
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
                .Include(a => a.Exceptions)
                .FirstOrDefaultAsync(a => a.Id == id && a.OrganizationId == organizationId);

            if (agenda == null)
                throw new NotFoundException("アジェンダが見つかりません。");

            if (agenda.IsCancelled)
                throw new BadRequestException("中止されたアジェンダは編集できません。");

            // 繰り返しルールが変更されたかチェック
            var recurrenceChanged =
                agenda.RecurrenceType != request.RecurrenceType ||
                agenda.RecurrenceInterval != request.RecurrenceInterval ||
                agenda.RecurrenceWeekOfMonth != request.RecurrenceWeekOfMonth ||
                agenda.StartAt != request.StartAt; // 開始日時も繰り返しに影響

            // 繰り返しルールが変更された場合は既存の例外を全削除
            if (recurrenceChanged && agenda.Exceptions != null && agenda.Exceptions.Any())
            {
                _context.AgendaExceptions.RemoveRange(agenda.Exceptions);
            }

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
            var existingUserIds = agenda.Attendees.Select(a => a.UserId).ToList();

            // 削除対象の参加者（通知用にIDを保存）
            var removedUserIds = existingUserIds.Where(id => !requestUserIds.Contains(id)).ToList();
            var toRemove = agenda.Attendees.Where(a => removedUserIds.Contains(a.UserId)).ToList();
            foreach (var item in toRemove)
            {
                _context.AgendaAttendees.Remove(item);
            }

            // 追加対象の参加者（通知用にIDを保存）
            var addedUserIds = new List<int>();

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
                        IsOptional = reqAttendee.IsOptional
                    });
                    addedUserIds.Add(reqAttendee.UserId);
                }
            }

            // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
            _context.Entry(agenda).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

            await _context.SaveChangesAsync();

            // 参加者追加通知（追加された本人以外への通知ではなく、追加された本人へ）
            if (request.SendNotification && addedUserIds.Count > 0)
            {
                await _notificationService.CreateBulkNotificationsAsync(
                    agenda.Id,
                    addedUserIds,
                    AgendaNotificationType.AddedToEvent,
                    agenda.StartAt,
                    null,
                    userId);
            }

            // 参加者削除通知（削除された本人へ）
            if (request.SendNotification && removedUserIds.Count > 0)
            {
                await _notificationService.CreateBulkNotificationsAsync(
                    agenda.Id,
                    removedUserIds,
                    AgendaNotificationType.RemovedFromEvent,
                    agenda.StartAt,
                    null,
                    userId);
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
            .Include(a => a.Attendees)
            .FirstOrDefaultAsync(a => a.Id == agendaId && a.OrganizationId == organizationId);

        if (agenda == null)
            throw new NotFoundException("アジェンダが見つかりません。");

        if (agenda.IsCancelled)
            throw new BadRequestException("中止されたアジェンダの参加状況は変更できません。");

        var attendee = agenda.Attendees?.FirstOrDefault(a => a.UserId == userId);

        if (attendee == null)
            throw new BadRequestException("このアジェンダの参加者ではありません。");

        // 出欠回答を Upsert（OccurrenceIndex = null はシリーズ全体への回答）
        var existingResponse = await _context.AgendaAttendanceResponses
            .FirstOrDefaultAsync(r => r.AgendaId == agendaId && r.UserId == userId && r.OccurrenceIndex == null);

        if (existingResponse != null)
        {
            existingResponse.Status = request.Status;
            existingResponse.RespondedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            _context.AgendaAttendanceResponses.Add(new AgendaAttendanceResponse
            {
                AgendaId = agendaId,
                UserId = userId,
                OccurrenceIndex = null,
                Status = request.Status,
                RespondedAt = DateTimeOffset.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        // 不参加に変更した場合、他の参加者に通知
        if (request.Status == AttendanceStatus.Declined)
        {
            var attendeesToNotify = agenda.Attendees?
                .Where(a => a.UserId != userId) // 変更した本人は除外
                .Select(a => a.UserId)
                .ToList() ?? [];

            if (attendeesToNotify.Count > 0)
            {
                await _notificationService.CreateBulkNotificationsAsync(
                    agendaId,
                    attendeesToNotify,
                    AgendaNotificationType.AttendanceDeclined,
                    agenda.StartAt,
                    null,
                    userId);
            }
        }

        return await GetByIdAsync(agendaId, organizationId);
    }

    /// <summary>
    /// 特定回の参加状況更新
    /// </summary>
    public async Task<AgendaResponse> UpdateOccurrenceAttendanceAsync(
        long agendaId,
        int organizationId,
        int userId,
        int occurrenceIndex,
        UpdateAttendanceRequest request)
    {
        var agenda = await _context.Agendas
            .AsNoTracking()
            .Include(a => a.Exceptions)
            .Include(a => a.Attendees)
            .FirstOrDefaultAsync(a => a.Id == agendaId && a.OrganizationId == organizationId);

        if (agenda == null)
            throw new NotFoundException("アジェンダが見つかりません。");

        if (agenda.IsCancelled)
            throw new BadRequestException("中止されたアジェンダの参加状況は変更できません。");

        // 繰り返しイベントでない場合はシリーズ全体の更新を使用
        if (agenda.RecurrenceType == null || agenda.RecurrenceType == RecurrenceType.None)
            throw new BadRequestException("単発イベントには特定回の参加状況を設定できません。");

        // 参加者かどうかを確認
        var attendee = agenda.Attendees?.FirstOrDefault(a => a.UserId == userId);

        if (attendee == null)
            throw new BadRequestException("このアジェンダの参加者ではありません。");

        // 対象のオカレンスが存在するか確認
        var farFuture = agenda.StartAt.AddYears(5);
        var allOccurrences = RecurrenceHelper.ExpandOccurrencesWithIndex(agenda, agenda.StartAt, farFuture);
        var targetOccurrence = allOccurrences.FirstOrDefault(o => o.Index == occurrenceIndex);
        if (targetOccurrence == null)
            throw new BadRequestException("指定されたインデックスはこのアジェンダの繰り返し回ではありません。");

        // この回が中止されていないか確認
        var exception = agenda.Exceptions?.FirstOrDefault(e => e.OccurrenceIndex == occurrenceIndex);
        if (exception?.IsCancelled == true)
            throw new BadRequestException("中止された回の参加状況は変更できません。");

        // 出欠回答を Upsert
        var existingResponse = await _context.AgendaAttendanceResponses
            .FirstOrDefaultAsync(r => r.AgendaId == agendaId && r.UserId == userId && r.OccurrenceIndex == occurrenceIndex);

        if (existingResponse != null)
        {
            existingResponse.Status = request.Status;
            existingResponse.RespondedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            _context.AgendaAttendanceResponses.Add(new AgendaAttendanceResponse
            {
                AgendaId = agendaId,
                UserId = userId,
                OccurrenceIndex = occurrenceIndex,
                Status = request.Status,
                RespondedAt = DateTimeOffset.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        // 不参加に変更した場合、他の参加者に通知（特定回の開始日時を含める）
        if (request.Status == AttendanceStatus.Declined)
        {
            var attendeesToNotify = agenda.Attendees?
                .Where(a => a.UserId != userId) // 変更した本人は除外
                .Select(a => a.UserId)
                .ToList() ?? [];

            if (attendeesToNotify.Count > 0)
            {
                await _notificationService.CreateBulkNotificationsAsync(
                    agendaId,
                    attendeesToNotify,
                    AgendaNotificationType.AttendanceDeclined,
                    targetOccurrence.StartAt,
                    null,
                    userId);
            }
        }

        return await GetByIdAsync(agendaId, organizationId, occurrenceIndex);
    }

    /// <summary>
    /// 特定回の参加状況をシリーズデフォルトにリセット
    /// </summary>
    public async Task<AgendaResponse> ResetOccurrenceAttendanceAsync(
        long agendaId,
        int organizationId,
        int userId,
        int occurrenceIndex)
    {
        var agenda = await _context.Agendas
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == agendaId && a.OrganizationId == organizationId);

        if (agenda == null)
            throw new NotFoundException("アジェンダが見つかりません。");

        // 繰り返しイベントでない場合はエラー
        if (agenda.RecurrenceType == null || agenda.RecurrenceType == RecurrenceType.None)
            throw new BadRequestException("単発イベントには特定回の参加状況はありません。");

        // 参加者かどうかを確認
        var attendee = await _context.AgendaAttendees
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AgendaId == agendaId && a.UserId == userId);

        if (attendee == null)
            throw new BadRequestException("このアジェンダの参加者ではありません。");

        // 特定回の回答を削除
        var existingResponse = await _context.AgendaAttendanceResponses
            .FirstOrDefaultAsync(r => r.AgendaId == agendaId && r.UserId == userId && r.OccurrenceIndex == occurrenceIndex);

        if (existingResponse != null)
        {
            _context.AgendaAttendanceResponses.Remove(existingResponse);
            await _context.SaveChangesAsync();
        }

        return await GetByIdAsync(agendaId, organizationId, occurrenceIndex);
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
        // かつ、自分が参加者のもののみ
        var agendas = await _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.Attendees)
            .Include(a => a.AttendanceResponses)
            .Include(a => a.Exceptions)
            .Where(a => a.OrganizationId == organizationId)
            .Where(a => a.Attendees.Any(at => at.UserId == currentUserId)) // 自分が参加者のみ
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
            var expandedOccurrences = RecurrenceHelper.ExpandOccurrencesWithIndex(agenda, start, end);

            foreach (var occurrence in expandedOccurrences)
            {
                var occurrenceEnd = occurrence.StartAt + duration;

                // 例外（中止・変更）を確認（インデックスで検索）
                var exception = agenda.Exceptions?
                    .FirstOrDefault(e => e.OccurrenceIndex == occurrence.Index);

                // この回が中止されているか
                var isCancelled = agenda.IsCancelled || (exception?.IsCancelled ?? false);
                var cancellationReason = agenda.IsCancelled
                    ? agenda.CancellationReason
                    : exception?.CancellationReason;

                // 例外で変更されている場合はその値を使用
                var title = exception?.ModifiedTitle ?? agenda.Title;
                var location = exception?.ModifiedLocation ?? agenda.Location;
                var url = exception?.ModifiedUrl ?? agenda.Url;
                var actualStart = exception?.ModifiedStartAt ?? occurrence.StartAt;
                var actualEnd = exception?.ModifiedEndAt ?? occurrenceEnd;

                // 現在ユーザーの参加状況を取得（特定回 > シリーズ全体 の優先順位）
                var myAttendanceStatus = GetEffectiveAttendanceStatus(
                    agenda.AttendanceResponses, currentUserId, occurrence.Index);

                occurrences.Add(new AgendaOccurrenceResponse
                {
                    AgendaId = agenda.Id,
                    ExceptionId = exception?.Id,
                    OccurrenceIndex = occurrence.Index,
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
                    MyAttendanceStatus = myAttendanceStatus,
                    CreatedBy = agenda.CreatedByUser == null ? null : ToUserItem(agenda.CreatedByUser)
                });
            }
        }

        // 開始日時でソート
        return occurrences.OrderBy(o => o.StartAt).ToList();
    }

    /// <summary>
    /// 有効な出欠ステータスを取得（特定回 > シリーズ全体 の優先順位）
    /// </summary>
    private static AttendanceStatus? GetEffectiveAttendanceStatus(
        ICollection<AgendaAttendanceResponse>? responses,
        int userId,
        int occurrenceIndex)
    {
        if (responses == null || responses.Count == 0)
            return null;

        // 特定回の回答があればそれを優先
        var occurrenceResponse = responses
            .FirstOrDefault(r => r.UserId == userId && r.OccurrenceIndex == occurrenceIndex);
        if (occurrenceResponse != null)
            return occurrenceResponse.Status;

        // シリーズ全体の回答
        var seriesResponse = responses
            .FirstOrDefault(r => r.UserId == userId && r.OccurrenceIndex == null);
        return seriesResponse?.Status;
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
    /// アジェンダ例外作成または更新（特定回の中止・変更）
    /// 同じ回の例外が既に存在する場合は更新します。
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

        // 対象のインデックスのオカレンスを計算
        var farFuture = agenda.StartAt.AddYears(5);
        var allOccurrences = RecurrenceHelper.ExpandOccurrencesWithIndex(agenda, agenda.StartAt, farFuture);
        var targetOccurrence = allOccurrences.FirstOrDefault(o => o.Index == request.OccurrenceIndex);
        if (targetOccurrence == null)
            throw new BadRequestException("指定されたインデックスはこのアジェンダの繰り返し回ではありません。");

        // 同じ回の例外が既に存在するか確認（インデックスで検索）
        var existingException = agenda.Exceptions?
            .FirstOrDefault(e => e.OccurrenceIndex == request.OccurrenceIndex);

        // 過去の回は変更不可
        if (targetOccurrence.StartAt < DateTimeOffset.UtcNow)
            throw new BadRequestException("過去の回は変更できません。");

        // バリデーション
        if (!request.IsCancelled && request.ModifiedEndAt.HasValue && request.ModifiedStartAt.HasValue)
        {
            if (request.ModifiedEndAt <= request.ModifiedStartAt)
                throw new BadRequestException("終了日時は開始日時より後である必要があります。");
        }

        AgendaException exception;
        bool isUpdate = existingException != null;

        if (isUpdate)
        {
            // 既存の例外を更新
            exception = existingException!;
            exception.IsCancelled = request.IsCancelled;
            exception.CancellationReason = request.IsCancelled ? request.CancellationReason : null;
            exception.ModifiedStartAt = request.IsCancelled ? null : request.ModifiedStartAt;
            exception.ModifiedEndAt = request.IsCancelled ? null : request.ModifiedEndAt;
            exception.ModifiedTitle = request.IsCancelled ? null : request.ModifiedTitle;
            exception.ModifiedLocation = request.IsCancelled ? null : request.ModifiedLocation;
            exception.ModifiedUrl = request.IsCancelled ? null : request.ModifiedUrl;
            exception.ModifiedDescription = request.IsCancelled ? null : request.ModifiedDescription;
        }
        else
        {
            // 新規作成
            exception = new AgendaException
            {
                AgendaId = agendaId,
                OccurrenceIndex = request.OccurrenceIndex,
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
        }

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
                    targetOccurrence.StartAt,
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

        // 対象のオカレンスの日時を計算（過去判定と通知用）
        var farFuture = agenda.StartAt.AddYears(5);
        var allOccurrences = RecurrenceHelper.ExpandOccurrencesWithIndex(agenda, agenda.StartAt, farFuture);
        var targetOccurrence = allOccurrences.FirstOrDefault(o => o.Index == exception.OccurrenceIndex);
        var occurrenceStartAt = targetOccurrence?.StartAt ?? agenda.StartAt;

        // 過去の回は変更不可
        if (occurrenceStartAt < DateTimeOffset.UtcNow)
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
                    occurrenceStartAt,
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

        // 対象のオカレンスの日時を計算（過去判定用）
        var farFuture = agenda.StartAt.AddYears(5);
        var allOccurrences = RecurrenceHelper.ExpandOccurrencesWithIndex(agenda, agenda.StartAt, farFuture);
        var targetOccurrence = allOccurrences.FirstOrDefault(o => o.Index == exception.OccurrenceIndex);
        var occurrenceStartAt = targetOccurrence?.StartAt ?? agenda.StartAt;

        // 過去の回は変更不可
        if (occurrenceStartAt < DateTimeOffset.UtcNow)
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
            .OrderBy(e => e.OccurrenceIndex)
            .ToListAsync();

        // 親アジェンダのオカレンス一覧を取得（元の日時を計算するため）
        List<OccurrenceInfo>? occurrences = null;
        if (agenda.RecurrenceType != RecurrenceType.None && exceptions.Count > 0)
        {
            var maxIndex = exceptions.Max(e => e.OccurrenceIndex);
            // 必要なインデックスまで十分展開するため、開始から遠い将来までの範囲で展開
            var rangeEnd = agenda.StartAt.AddYears(10);
            occurrences = RecurrenceHelper.ExpandOccurrencesWithIndex(
                agenda,
                agenda.StartAt,
                rangeEnd,
                maxIndex + 10  // 余裕を持った回数
            );
        }

        return exceptions.Select(e => ToExceptionResponse(e, occurrences)).ToList();
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

        return ToExceptionResponse(exception, null);
    }

    private AgendaExceptionResponse ToExceptionResponse(
        AgendaException exception,
        List<OccurrenceInfo>? occurrences)
    {
        // オカレンス一覧から元の日時を取得
        DateTimeOffset? originalStartAt = null;
        if (occurrences != null)
        {
            var occ = occurrences.FirstOrDefault(o => o.Index == exception.OccurrenceIndex);
            originalStartAt = occ?.StartAt;
        }

        return new AgendaExceptionResponse
        {
            Id = exception.Id,
            AgendaId = exception.AgendaId,
            OccurrenceIndex = exception.OccurrenceIndex,
            OriginalStartAt = originalStartAt,
            IsCancelled = exception.IsCancelled,
            CancellationReason = exception.CancellationReason,
            ModifiedStartAt = exception.ModifiedStartAt,
            ModifiedEndAt = exception.ModifiedEndAt,
            ModifiedTitle = exception.ModifiedTitle,
            ModifiedLocation = exception.ModifiedLocation,
            ModifiedUrl = exception.ModifiedUrl,
            ModifiedDescription = exception.ModifiedDescription,
            CreatedAt = exception.CreatedAt,
            CreatedBy = exception.CreatedByUser == null ? null : ToUserItem(exception.CreatedByUser)
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

            // 分割地点のインデックスを見つける
            var farFuture = originalAgenda.StartAt.AddYears(5);
            var allOccurrences = RecurrenceHelper.ExpandOccurrencesWithIndex(originalAgenda, originalAgenda.StartAt, farFuture);
            var splitOccurrence = allOccurrences.FirstOrDefault(o => o.Index == request.FromOccurrenceIndex);
            if (splitOccurrence == null)
                throw new BadRequestException("指定されたインデックスはこのアジェンダの繰り返し回ではありません。");

            // 過去の回からの分割は不可
            if (splitOccurrence.StartAt < DateTimeOffset.UtcNow)
                throw new BadRequestException("過去の回からの分割はできません。");

            // 最初の回で分割しようとした場合は通常の更新を使用すべき
            if (request.FromOccurrenceIndex == 0)
                throw new BadRequestException("最初の回からの分割はできません。シリーズ全体の更新を使用してください。");

            // ===== 元のシリーズを分割地点の前日で終了 =====
            // 分割地点の1つ前の回を見つける
            var previousOccurrence = allOccurrences.FirstOrDefault(o => o.Index == request.FromOccurrenceIndex - 1);
            if (previousOccurrence == null)
                throw new BadRequestException("分割地点より前の回が見つかりません。");

            originalAgenda.RecurrenceEndDate = DateOnly.FromDateTime(previousOccurrence.StartAt.UtcDateTime);
            originalAgenda.RecurrenceCount = null; // 終了日指定に切り替え
            originalAgenda.UpdatedAt = DateTimeOffset.UtcNow;

            // ===== 新しいシリーズを作成 =====
            // 新しいシリーズの開始日時は、分割地点と同じ日付で、
            // 時刻はrequest.StartAtの時刻を使用（時刻変更の場合に対応）
            var newStartAt = new DateTimeOffset(
                splitOccurrence.StartAt.Year,
                splitOccurrence.StartAt.Month,
                splitOccurrence.StartAt.Day,
                request.StartAt.Hour,
                request.StartAt.Minute,
                request.StartAt.Second,
                request.StartAt.Offset);

            // 終了日時も同様に調整
            var duration = request.EndAt - request.StartAt;
            var newEndAt = newStartAt + duration;

            var newAgenda = new Agenda
            {
                OrganizationId = organizationId,
                Title = request.Title,
                Description = request.Description,
                StartAt = newStartAt,
                EndAt = newEndAt,
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
                // 元のシリーズでのリマインダー設定を引き継ぎ
                var originalAttendee = originalAgenda.Attendees
                    .FirstOrDefault(a => a.UserId == reqAttendee.UserId);

                newAgenda.Attendees.Add(new AgendaAttendee
                {
                    UserId = reqAttendee.UserId,
                    IsOptional = reqAttendee.IsOptional,
                    CustomReminders = originalAttendee?.CustomReminders
                });
            }

            _context.Agendas.Add(newAgenda);
            await _context.SaveChangesAsync();

            // ===== 分割地点以降の例外を新しいシリーズに移行 =====
            // インデックスベースで、分割地点以降の例外を移行
            var exceptionsToMove = originalAgenda.Exceptions?
                .Where(e => e.OccurrenceIndex >= request.FromOccurrenceIndex)
                .ToList() ?? new List<AgendaException>();

            // 元のシリーズと新しいシリーズの時刻差を計算
            var timeShift = newStartAt.TimeOfDay - originalAgenda.StartAt.TimeOfDay;

            foreach (var exception in exceptionsToMove)
            {
                // 新しいシリーズに例外をコピー
                // インデックスは新しいシリーズの視点で再計算（分割地点が0になる）
                var newOccurrenceIndex = exception.OccurrenceIndex - request.FromOccurrenceIndex;

                var newException = new AgendaException
                {
                    AgendaId = newAgenda.Id,
                    OccurrenceIndex = newOccurrenceIndex,
                    IsCancelled = exception.IsCancelled,
                    CancellationReason = exception.CancellationReason,
                    // ModifiedStartAt/EndAt も時刻変更に合わせて調整（設定されている場合）
                    ModifiedStartAt = exception.ModifiedStartAt.HasValue
                        ? exception.ModifiedStartAt.Value + timeShift
                        : null,
                    ModifiedEndAt = exception.ModifiedEndAt.HasValue
                        ? exception.ModifiedEndAt.Value + timeShift
                        : null,
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
                        splitOccurrence.StartAt,
                        $"{splitOccurrence.StartAt:yyyy/MM/dd}以降のイベントが変更されました",
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

    private AgendaResponse ToResponse(Agenda agenda, int? occurrenceIndex = null)
    {
        // 特定回の例外を取得（例外情報を適用するため）
        AgendaException? exception = null;
        if (occurrenceIndex.HasValue && agenda.Exceptions != null)
        {
            exception = agenda.Exceptions.FirstOrDefault(e => e.OccurrenceIndex == occurrenceIndex.Value);
        }

        // 例外情報を適用した値を計算
        var title = exception?.ModifiedTitle ?? agenda.Title;
        var description = exception?.ModifiedDescription ?? agenda.Description;
        var location = exception?.ModifiedLocation ?? agenda.Location;
        var url = exception?.ModifiedUrl ?? agenda.Url;
        var startAt = exception?.ModifiedStartAt ?? agenda.StartAt;
        var endAt = exception?.ModifiedEndAt ?? agenda.EndAt;

        return new AgendaResponse
        {
            Id = agenda.Id,
            OrganizationId = agenda.OrganizationId,
            Title = title,
            Description = description,
            StartAt = startAt,
            EndAt = endAt,
            IsAllDay = agenda.IsAllDay,
            Location = location,
            Url = url,
            RecurrenceType = agenda.RecurrenceType,
            RecurrenceInterval = agenda.RecurrenceInterval,
            RecurrenceWeekOfMonth = agenda.RecurrenceWeekOfMonth,
            RecurrenceEndDate = agenda.RecurrenceEndDate,
            RecurrenceCount = agenda.RecurrenceCount,
            NextOccurrenceStartAt = CalculateNextOccurrenceStartAt(agenda),
            Reminders = ParseRemindersFromString(agenda.DefaultReminders),
            IsCancelled = agenda.IsCancelled,
            CancellationReason = agenda.CancellationReason,
            CancelledAt = agenda.CancelledAt,
            CancelledBy = agenda.CancelledByUser == null ? null : ToUserItem(agenda.CancelledByUser),
            CreatedByUserId = agenda.CreatedByUserId,
            CreatedAt = agenda.CreatedAt,
            UpdatedAt = agenda.UpdatedAt,
            RowVersion = agenda.RowVersion,
            CreatedBy = agenda.CreatedByUser == null ? null : ToUserItem(agenda.CreatedByUser),
            Attendees = agenda.Attendees.Select(a =>
            {
                // シリーズ全体の出欠回答を取得
                var seriesResponse = agenda.AttendanceResponses?
                    .FirstOrDefault(r => r.UserId == a.UserId && r.OccurrenceIndex == null);

                // 特定回の出欠回答を取得（occurrenceIndexが指定された場合のみ）
                AttendanceStatus? occurrenceStatus = null;
                if (occurrenceIndex.HasValue)
                {
                    var occurrenceResponse = agenda.AttendanceResponses?
                        .FirstOrDefault(r => r.UserId == a.UserId && r.OccurrenceIndex == occurrenceIndex.Value);
                    occurrenceStatus = occurrenceResponse?.Status;
                }

                return new AgendaAttendeeResponse
                {
                    UserId = a.UserId,
                    Status = seriesResponse?.Status ?? AttendanceStatus.Pending,
                    OccurrenceStatus = occurrenceStatus,
                    IsOptional = a.IsOptional,
                    CustomReminders = ParseRemindersFromString(a.CustomReminders),
                    User = a.User == null ? null : ToUserItem(a.User)
                };
            }).OrderBy(a => a.User?.Username).ToList()
        };
    }

    /// <summary>
    /// 今日以降の次の回の開始日時を計算
    /// </summary>
    private DateTimeOffset? CalculateNextOccurrenceStartAt(Agenda agenda)
    {
        // 繰り返しアジェンダでない場合はnull
        if (agenda.RecurrenceType == null || agenda.RecurrenceType == RecurrenceType.None)
            return null;

        // 中止されている場合はnull
        if (agenda.IsCancelled)
            return null;

        // 今日の0時を起点にして、今後1年間の範囲で次の回を探す
        var today = DateTimeOffset.UtcNow.Date;
        var rangeStart = new DateTimeOffset(today, TimeSpan.Zero);
        var rangeEnd = rangeStart.AddYears(1);

        // アジェンダの開始日が未来の場合は、開始日を起点にする
        if (agenda.StartAt > rangeStart)
        {
            rangeStart = agenda.StartAt;
        }

        var occurrences = RecurrenceHelper.ExpandOccurrencesWithIndex(agenda, rangeStart, rangeEnd);

        // 例外で中止されているインデックスのセットを作成
        var cancelledIndices = agenda.Exceptions?.Where(e => e.IsCancelled).Select(e => e.OccurrenceIndex).ToHashSet()
            ?? new HashSet<int>();

        // 中止されていない最初の回を返す
        return occurrences
            .Where(o => !cancelledIndices.Contains(o.Index))
            .Select(o => (DateTimeOffset?)o.StartAt)
            .FirstOrDefault();
    }

    private UserIdentityResponse ToUserItem(User user)
    {
        return new UserIdentityResponse
        {
            Id = user.Id,
            Username = user.Username,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(user.AvatarType, user.Id, user.Username, user.Email, user.UserAvatarPath),
            IsActive = user.IsActive,
        };
    }
}
