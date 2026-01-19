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

    public async Task<List<AgendaResponse>> GetListAsync(int organizationId, DateTimeOffset start, DateTimeOffset end)
    {
        var query = _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.Attendees)
                .ThenInclude(at => at.User)
            .Where(a => a.OrganizationId == organizationId && a.StartAt < end && a.EndAt > start);

        var agendas = await query
            .OrderBy(a => a.StartAt)
            .ToListAsync();

        return agendas.Select(ToResponse).ToList();
    }

    public async Task<List<AgendaResponse>> GetRecentListAsync(int organizationId, int limit = 20)
    {
        var now = DateTimeOffset.UtcNow;
        var query = _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.Attendees)
                .ThenInclude(at => at.User)
            .Where(a => a.OrganizationId == organizationId && a.EndAt > now);

        var agendas = await query
            .OrderBy(a => a.StartAt)
            .Take(limit)
            .ToListAsync();

        return agendas.Select(ToResponse).ToList();
    }

    public async Task<AgendaResponse> GetByIdAsync(long id, int organizationId)
    {
        var query = _context.Agendas
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
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

    public async Task<AgendaResponse> CreateAsync(int organizationId, int userId, CreateAgendaRequest request)
    {
        if (request.EndAt <= request.StartAt)
        {
            throw new BadRequestException("終了日時は開始日時より後である必要があります。");
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
                CreatedByUserId = userId
            };

            if (request.Attendees != null && request.Attendees.Any())
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
            await transaction.CommitAsync();

            return await GetByIdAsync(agenda.Id, organizationId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<AgendaResponse> UpdateAsync(long id, int organizationId, UpdateAgendaRequest request)
    {
        if (request.EndAt <= request.StartAt)
        {
            throw new BadRequestException("終了日時は開始日時より後である必要があります。");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var query = _context.Agendas
                .Include(a => a.Attendees)
                .Where(a => a.Id == id && a.OrganizationId == organizationId);

            var agenda = await query.FirstOrDefaultAsync();

            if (agenda == null) throw new NotFoundException("アジェンダが見つかりません。");

            agenda.Title = request.Title;
            agenda.Description = request.Description;
            agenda.StartAt = request.StartAt;
            agenda.EndAt = request.EndAt;
            agenda.IsAllDay = request.IsAllDay;
            agenda.Location = request.Location;
            agenda.Url = request.Url;

            // 参加者の更新
            // UIから全量リストが送られてくる前提。
            var requestUserIds = request.Attendees.Select(r => r.UserId).Distinct().ToList();

            // 削除
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
                    // Statusは変更しない（再通知機能などが必要な場合はここでStatusリセットするが、今回はしない）
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

    public async Task DeleteAsync(long id, int organizationId)
    {
        var query = _context.Agendas.Where(a => a.Id == id && a.OrganizationId == organizationId);

        var agenda = await query.FirstOrDefaultAsync();
        if (agenda == null) throw new NotFoundException("アジェンダが見つかりません。");

        _context.Agendas.Remove(agenda);
        await _context.SaveChangesAsync();
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
