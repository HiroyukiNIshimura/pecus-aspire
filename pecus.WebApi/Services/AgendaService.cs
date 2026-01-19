using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Requests.Agenda;
using Pecus.Models.Responses.Agenda;

namespace Pecus.Services;

public class AgendaService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AgendaService> _logger;

    public AgendaService(ApplicationDbContext context, ILogger<AgendaService> logger)
    {
        _context = context;
        _logger = logger;
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
    /// アジェンダ作成（単発・繰り返しイベント対応）
    /// </summary>
    public async Task<AgendaResponse> CreateAsync(int organizationId, int userId, CreateAgendaRequest request)
    {
        if (request.EndAt <= request.StartAt)
        {
            throw new BadRequestException("終了日時は開始日時より後である必要があります。");
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
                    agenda.Attendees.Add(new AgendaAttendee
                    {
                        UserId = reqAttendee.UserId,
                        IsOptional = reqAttendee.IsOptional,
                        Status = AttendanceStatus.Pending
                    });
                }
            }

            _context.Agendas.Add(agenda);
            await _context.SaveChangesAsync();

            // TODO: Phase 7で通知機能を実装
            // if (request.SendNotification && agenda.Attendees.Any())
            // {
            //     await CreateInvitationNotificationsAsync(agenda);
            // }

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
            var requestUserIds = request.Attendees.Select(r => r.UserId).Distinct().ToList();

            // 削除対象の参加者
            var toRemove = agenda.Attendees.Where(a => !requestUserIds.Contains(a.UserId)).ToList();
            foreach (var item in toRemove)
            {
                _context.AgendaAttendees.Remove(item);
            }

            // 更新/追加
            foreach (var reqAttendee in request.Attendees)
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

            // TODO: Phase 7で通知機能を実装
            // if (request.SendNotification && agenda.Attendees.Any())
            // {
            //     await CreateCancellationNotificationsAsync(agenda);
            // }

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
        var now = DateTimeOffset.UtcNow;
        // 3ヶ月先まで展開して取得
        var end = now.AddMonths(3);

        var occurrences = await GetOccurrencesAsync(organizationId, currentUserId, now, end);

        return occurrences
            .Where(o => o.EndAt > now) // 終了していないもののみ
            .Take(limit)
            .ToList();
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
