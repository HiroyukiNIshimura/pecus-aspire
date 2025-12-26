using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB.Seed;

/// <summary>
/// 本番環境向けのシードデータ生成
/// </summary>
public class ProductAtoms
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductAtoms> _logger;
    private readonly CommonAtoms _seedAtoms;

    private const string BackOfficeOrgCode = "SYS-MAINT-001";
    private const string BackOfficeAdminEmail = "admin@backoffice.local";
    private const string BackOfficeOperator1Email = "operator1@backoffice.local";
    private const string BackOfficeOperator2Email = "operator2@backoffice.local";

    /// <summary>
    ///  Constructor
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    /// <param name="seedAtoms"></param>
    public ProductAtoms(
        ApplicationDbContext context,
        ILogger<ProductAtoms> logger,
        CommonAtoms seedAtoms)
    {
        _context = context;
        _logger = logger;
        _seedAtoms = seedAtoms;
    }

    /// <summary>
    /// 本番環境用のデータを投入
    /// </summary>
    public async Task SeedProductAsync()
    {
        _logger.LogInformation("Seeding production data...");

        await _seedAtoms.SeedPermissionsAsync(_context);
        await _seedAtoms.SeedRolesAsync(_context);
        await _seedAtoms.SeedGenresAsync(_context);
        await _seedAtoms.SeedTaskTypesAsync(_context);

        await SeedBackOfficeOrganizationAsync();
        await SeedBackOfficeOrganizationSettingsAsync();
        await SeedBackOfficeBotsAsync();
        await SeedBackOfficeUsersAsync();
        await SeedBackOfficeChatActorsAsync();
        await SeedBackOfficeChatRoomsAsync();

        if (Environment.GetEnvironmentVariable("PECUS_DEMO_MODE") == "true")
        {
            _logger.LogInformation("Demo mode is enabled. Seeding demo data...");
        }

        _logger.LogInformation("Production data seeding completed");
    }

    private async Task SeedBackOfficeOrganizationAsync()
    {
        if (await _context.Organizations.AnyAsync(o => o.Code == BackOfficeOrgCode))
        {
            _logger.LogInformation("BackOffice organization already exists, skipping...");
            return;
        }

        var organization = new Organization
        {
            Name = "System Maintenance",
            Code = BackOfficeOrgCode,
            PhoneNumber = "000-0000-0000",
            Email = "system@backoffice.local",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Organizations.AddAsync(organization);
        await _context.SaveChangesAsync();
        _logger.LogInformation("BackOffice organization created: {Name}", organization.Name);
    }

    private async Task SeedBackOfficeOrganizationSettingsAsync()
    {
        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == BackOfficeOrgCode);
        if (org == null)
        {
            _logger.LogWarning("BackOffice organization not found. Skipping settings seeding.");
            return;
        }

        if (await _context.OrganizationSettings.AnyAsync(s => s.OrganizationId == org.Id))
        {
            _logger.LogInformation("BackOffice organization settings already exist, skipping...");
            return;
        }

        var settings = new OrganizationSetting
        {
            OrganizationId = org.Id,
            TaskOverdueThreshold = 0,
            WeeklyReportDeliveryDay = 0,
            MailFromAddress = org.Email,
            MailFromName = org.Name,
            GenerativeApiVendor = GenerativeApiVendor.DeepSeek,
            Plan = OrganizationPlan.Enterprise,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await _context.OrganizationSettings.AddAsync(settings);
        await _context.SaveChangesAsync();
        _logger.LogInformation("BackOffice organization settings created");
    }

    private async Task SeedBackOfficeBotsAsync()
    {
        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == BackOfficeOrgCode);
        if (org == null)
        {
            _logger.LogWarning("BackOffice organization not found. Skipping bot seeding.");
            return;
        }

        var systemBotPersona = BotPersonaHelper.GetSystemBotPersona();
        var systemBotConstraint = BotPersonaHelper.GetSystemBotConstraint();
        var chatBotPersona = BotPersonaHelper.GetChatBotPersona();
        var chatBotConstraint = BotPersonaHelper.GetChatBotConstraint();

        var existingSystemBot = await _context.Bots
            .FirstOrDefaultAsync(b => b.OrganizationId == org.Id && b.Type == BotType.SystemBot);
        var existingChatBot = await _context.Bots
            .FirstOrDefaultAsync(b => b.OrganizationId == org.Id && b.Type == BotType.ChatBot);

        if (existingSystemBot != null)
        {
            existingSystemBot.Persona = systemBotPersona;
            existingSystemBot.Constraint = systemBotConstraint;
            existingSystemBot.UpdatedAt = DateTimeOffset.UtcNow;
            _logger.LogInformation("BackOffice SystemBot Persona/Constraint updated: {Name}", existingSystemBot.Name);
        }
        else
        {
            var bot1 = new Bot
            {
                OrganizationId = org.Id,
                Type = BotType.SystemBot,
                Name = "Butler Bot",
                IconUrl = "/icons/bot/system.webp",
                Persona = systemBotPersona,
                Constraint = systemBotConstraint,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            await _context.Bots.AddAsync(bot1);
            _logger.LogInformation("BackOffice SystemBot created: {Name}", bot1.Name);
        }

        if (existingChatBot != null)
        {
            existingChatBot.Persona = chatBotPersona;
            existingChatBot.Constraint = chatBotConstraint;
            existingChatBot.UpdatedAt = DateTimeOffset.UtcNow;
            _logger.LogInformation("BackOffice ChatBot Persona/Constraint updated: {Name}", existingChatBot.Name);
        }
        else
        {
            var bot2 = new Bot
            {
                OrganizationId = org.Id,
                Type = BotType.ChatBot,
                Name = "Coati Bot",
                IconUrl = "/icons/bot/chat.webp",
                Persona = chatBotPersona,
                Constraint = chatBotConstraint,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            await _context.Bots.AddAsync(bot2);
            _logger.LogInformation("BackOffice ChatBot created: {Name}", bot2.Name);
        }

        await _context.SaveChangesAsync();
    }

    private async Task SeedBackOfficeUsersAsync()
    {
        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == BackOfficeOrgCode);
        if (org == null)
        {
            _logger.LogWarning("BackOffice organization not found. Skipping user seeding.");
            return;
        }

        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Administrator");
        var memberRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Member");

        if (adminRole == null || memberRole == null)
        {
            _logger.LogWarning("Required roles not found. Skipping user seeding.");
            return;
        }

        var users = new List<(Role Role, string Email, string Username, string LoginId)>
        {
            (adminRole, BackOfficeAdminEmail, "BackOffice Admin", "backoffice-admin"),
            (memberRole, BackOfficeOperator1Email, "Operator One", "backoffice-operator1"),
            (memberRole, BackOfficeOperator2Email, "Operator Two", "backoffice-operator2")
        };

        foreach (var (role, email, username, loginId) in users)
        {
            if (await _context.Users.AnyAsync(u => u.Email == email))
            {
                _logger.LogInformation("User {Email} already exists, skipping...", email);
                continue;
            }

            var user = new User
            {
                OrganizationId = org.Id,
                Email = email,
                Username = username,
                LoginId = loginId,
                PasswordHash = "BACKOFFICE_PLACEHOLDER_HASH",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            user.Roles.Add(role);

            await _context.Users.AddAsync(user);
            _logger.LogInformation("BackOffice user created: {Email}", user.Email);
        }

        await _context.SaveChangesAsync();
    }

    private async Task SeedBackOfficeChatActorsAsync()
    {
        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == BackOfficeOrgCode);
        if (org == null)
        {
            _logger.LogWarning("BackOffice organization not found. Skipping chat actor seeding.");
            return;
        }

        var userEmails = new[] { BackOfficeAdminEmail, BackOfficeOperator1Email, BackOfficeOperator2Email };

        foreach (var email in userEmails)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) continue;

            if (await _context.ChatActors.AnyAsync(a => a.UserId == user.Id))
            {
                continue;
            }

            var actor = new ChatActor
            {
                OrganizationId = org.Id,
                ActorType = ChatActorType.User,
                UserId = user.Id,
                BotId = null,
                DisplayName = user.Username,
                AvatarType = user.AvatarType,
                AvatarUrl = user.UserAvatarPath,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            await _context.ChatActors.AddAsync(actor);
        }

        var bot = await _context.Bots.FirstOrDefaultAsync(b => b.OrganizationId == org.Id && b.Name == "BackOffice Assistant");
        if (bot != null && !await _context.ChatActors.AnyAsync(a => a.BotId == bot.Id))
        {
            var botActor = new ChatActor
            {
                OrganizationId = org.Id,
                ActorType = ChatActorType.Bot,
                UserId = null,
                BotId = bot.Id,
                DisplayName = bot.Name,
                AvatarType = null,
                AvatarUrl = bot.IconUrl,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            await _context.ChatActors.AddAsync(botActor);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("BackOffice chat actors created");
    }

    private async Task SeedBackOfficeChatRoomsAsync()
    {
        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == BackOfficeOrgCode);
        if (org == null)
        {
            _logger.LogWarning("BackOffice organization not found. Skipping chat room seeding.");
            return;
        }

        var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == BackOfficeAdminEmail);
        var operator1User = await _context.Users.FirstOrDefaultAsync(u => u.Email == BackOfficeOperator1Email);
        var operator2User = await _context.Users.FirstOrDefaultAsync(u => u.Email == BackOfficeOperator2Email);

        if (adminUser == null || operator1User == null || operator2User == null)
        {
            _logger.LogWarning("Required users not found. Skipping chat room seeding.");
            return;
        }

        var adminActor = await _context.ChatActors.FirstOrDefaultAsync(a => a.UserId == adminUser.Id);
        var operator1Actor = await _context.ChatActors.FirstOrDefaultAsync(a => a.UserId == operator1User.Id);
        var operator2Actor = await _context.ChatActors.FirstOrDefaultAsync(a => a.UserId == operator2User.Id);

        if (adminActor == null || operator1Actor == null || operator2Actor == null)
        {
            _logger.LogWarning("Required chat actors not found. Skipping chat room seeding.");
            return;
        }

        var directMessagePairs = new List<(ChatActor actor1, ChatActor actor2, User user1, User user2)>
        {
            (adminActor, operator1Actor, adminUser, operator1User),
            (adminActor, operator2Actor, adminUser, operator2User)
        };

        foreach (var (actor1, actor2, user1, user2) in directMessagePairs)
        {
            var minId = Math.Min(user1.Id, user2.Id);
            var maxId = Math.Max(user1.Id, user2.Id);
            var dmUserPair = $"{minId}_{maxId}";

            var existingRoom = await _context.ChatRooms
                .Where(r => r.OrganizationId == org.Id && r.Type == ChatRoomType.Dm && r.DmUserPair == dmUserPair)
                .FirstOrDefaultAsync();

            if (existingRoom != null)
            {
                _logger.LogInformation("Direct message room between {Actor1} and {Actor2} already exists, skipping...", actor1.DisplayName, actor2.DisplayName);
                continue;
            }

            var room = new ChatRoom
            {
                OrganizationId = org.Id,
                Type = ChatRoomType.Dm,
                DmUserPair = dmUserPair,
                CreatedByUserId = user1.Id,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            await _context.ChatRooms.AddAsync(room);
            await _context.SaveChangesAsync();

            var members = new List<ChatRoomMember>
            {
                new ChatRoomMember
                {
                    ChatRoomId = room.Id,
                    ChatActorId = actor1.Id,
                    Role = ChatRoomRole.Member,
                    JoinedAt = DateTimeOffset.UtcNow
                },
                new ChatRoomMember
                {
                    ChatRoomId = room.Id,
                    ChatActorId = actor2.Id,
                    Role = ChatRoomRole.Member,
                    JoinedAt = DateTimeOffset.UtcNow
                }
            };

            await _context.ChatRoomMembers.AddRangeAsync(members);
            await _context.SaveChangesAsync();

            _logger.LogInformation("BackOffice direct message room created: {User1} - {User2}", user1.Username, user2.Username);
        }

        _logger.LogInformation("BackOffice chat rooms seeding completed");
    }
}