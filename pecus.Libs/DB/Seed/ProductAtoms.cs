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

        await SeedBackOfficeDataAsync();

        if (Environment.GetEnvironmentVariable("PECUS_DEMO_MODE") == "true")
        {
            _logger.LogInformation("Demo mode is enabled. Seeding demo data...");
        }

        _logger.LogInformation("Production data seeding completed");
    }

    /// <summary>
    /// BackOffice関連のデータを1つのトランザクションで投入
    /// </summary>
    private async Task SeedBackOfficeDataAsync()
    {
        var existingOrg = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == BackOfficeOrgCode);
        if (existingOrg != null)
        {
            _logger.LogInformation("BackOffice organization already exists, updating bots if needed...");
            await UpdateBackOfficeBotsAsync(existingOrg);
            return;
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _logger.LogInformation("Creating BackOffice organization and related data...");

            var organization = CreateBackOfficeOrganization();
            await _context.Organizations.AddAsync(organization);
            await _context.SaveChangesAsync();

            var settings = CreateBackOfficeOrganizationSettings(organization);
            await _context.OrganizationSettings.AddAsync(settings);

            var (systemBot, chatBot) = CreateBackOfficeBots(organization);
            await _context.Bots.AddRangeAsync(systemBot, chatBot);
            await _context.SaveChangesAsync();

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            var memberRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
            if (adminRole == null || memberRole == null)
            {
                _logger.LogWarning("Required roles not found. Rolling back transaction.");
                await transaction.RollbackAsync();
                return;
            }

            var users = CreateBackOfficeUsers(organization, adminRole, memberRole);
            await _context.Users.AddRangeAsync(users);
            await _context.SaveChangesAsync();

            var chatActors = CreateBackOfficeChatActors(organization, users, chatBot);
            await _context.ChatActors.AddRangeAsync(chatActors);
            await _context.SaveChangesAsync();

            var chatRooms = CreateBackOfficeChatRooms(organization, users, chatActors);
            await _context.ChatRooms.AddRangeAsync(chatRooms);
            await _context.SaveChangesAsync();

            var chatRoomMembers = CreateChatRoomMembers(chatRooms, users, chatActors);
            await _context.ChatRoomMembers.AddRangeAsync(chatRoomMembers);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            _logger.LogInformation("BackOffice data seeding completed successfully");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to seed BackOffice data. Transaction rolled back.");
            throw;
        }
    }

    private async Task UpdateBackOfficeBotsAsync(Organization org)
    {
        var systemBotPersona = BotPersonaHelper.GetSystemBotPersona();
        var systemBotConstraint = BotPersonaHelper.GetSystemBotConstraint();
        var chatBotPersona = BotPersonaHelper.GetChatBotPersona();
        var chatBotConstraint = BotPersonaHelper.GetChatBotConstraint();

        var existingSystemBot = await _context.Bots
            .FirstOrDefaultAsync(b => b.OrganizationId == org.Id && b.Type == BotType.SystemBot);
        var existingChatBot = await _context.Bots
            .FirstOrDefaultAsync(b => b.OrganizationId == org.Id && b.Type == BotType.ChatBot);

        var updated = false;

        if (existingSystemBot != null)
        {
            existingSystemBot.Persona = systemBotPersona;
            existingSystemBot.Constraint = systemBotConstraint;
            existingSystemBot.UpdatedAt = DateTimeOffset.UtcNow;
            updated = true;
            _logger.LogInformation("BackOffice SystemBot Persona/Constraint updated: {Name}", existingSystemBot.Name);
        }

        if (existingChatBot != null)
        {
            existingChatBot.Persona = chatBotPersona;
            existingChatBot.Constraint = chatBotConstraint;
            existingChatBot.UpdatedAt = DateTimeOffset.UtcNow;
            updated = true;
            _logger.LogInformation("BackOffice ChatBot Persona/Constraint updated: {Name}", existingChatBot.Name);
        }

        if (updated)
        {
            await _context.SaveChangesAsync();
        }
    }

    private Organization CreateBackOfficeOrganization()
    {
        return new Organization
        {
            Name = "System Maintenance",
            Code = BackOfficeOrgCode,
            PhoneNumber = "000-0000-0000",
            Email = "system@backoffice.local",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private OrganizationSetting CreateBackOfficeOrganizationSettings(Organization org)
    {
        return new OrganizationSetting
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
    }

    private (Bot SystemBot, Bot ChatBot) CreateBackOfficeBots(Organization org)
    {
        var systemBotPersona = BotPersonaHelper.GetSystemBotPersona();
        var systemBotConstraint = BotPersonaHelper.GetSystemBotConstraint();
        var chatBotPersona = BotPersonaHelper.GetChatBotPersona();
        var chatBotConstraint = BotPersonaHelper.GetChatBotConstraint();

        var systemBot = new Bot
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

        var chatBot = new Bot
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

        return (systemBot, chatBot);
    }

    private List<User> CreateBackOfficeUsers(Organization org, Role adminRole, Role memberRole)
    {
        var usersData = new List<(Role Role, string Email, string Username, string LoginId)>
        {
            (adminRole, BackOfficeAdminEmail, "BackOffice Admin", "backoffice-admin"),
            (memberRole, BackOfficeOperator1Email, "Operator One", "backoffice-operator1"),
            (memberRole, BackOfficeOperator2Email, "Operator Two", "backoffice-operator2")
        };

        var users = new List<User>();
        foreach (var (role, email, username, loginId) in usersData)
        {
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
            users.Add(user);
        }

        return users;
    }

    private List<ChatActor> CreateBackOfficeChatActors(Organization org, List<User> users, Bot chatBot)
    {
        var chatActors = new List<ChatActor>();

        foreach (var user in users)
        {
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
            chatActors.Add(actor);
        }

        var botActor = new ChatActor
        {
            OrganizationId = org.Id,
            ActorType = ChatActorType.Bot,
            UserId = null,
            BotId = chatBot.Id,
            DisplayName = chatBot.Name,
            AvatarType = null,
            AvatarUrl = chatBot.IconUrl,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        chatActors.Add(botActor);

        return chatActors;
    }

    private List<ChatRoom> CreateBackOfficeChatRooms(
        Organization org,
        List<User> users,
        List<ChatActor> chatActors)
    {
        var adminUser = users.First(u => u.Email == BackOfficeAdminEmail);
        var operator1User = users.First(u => u.Email == BackOfficeOperator1Email);
        var operator2User = users.First(u => u.Email == BackOfficeOperator2Email);

        var rooms = new List<ChatRoom>();

        var directMessagePairs = new List<(User user1, User user2)>
        {
            (adminUser, operator1User),
            (adminUser, operator2User)
        };

        foreach (var (user1, user2) in directMessagePairs)
        {
            var minId = Math.Min(user1.Id, user2.Id);
            var maxId = Math.Max(user1.Id, user2.Id);
            var dmUserPair = $"{minId}_{maxId}";

            var room = new ChatRoom
            {
                OrganizationId = org.Id,
                Type = ChatRoomType.Dm,
                DmUserPair = dmUserPair,
                CreatedByUserId = user1.Id,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            rooms.Add(room);
        }

        return rooms;
    }

    private List<ChatRoomMember> CreateChatRoomMembers(
        List<ChatRoom> rooms,
        List<User> users,
        List<ChatActor> chatActors)
    {
        var adminUser = users.First(u => u.Email == BackOfficeAdminEmail);
        var operator1User = users.First(u => u.Email == BackOfficeOperator1Email);
        var operator2User = users.First(u => u.Email == BackOfficeOperator2Email);

        var adminActor = chatActors.First(a => a.UserId == adminUser.Id);
        var operator1Actor = chatActors.First(a => a.UserId == operator1User.Id);
        var operator2Actor = chatActors.First(a => a.UserId == operator2User.Id);

        var members = new List<ChatRoomMember>();

        var actorPairs = new List<(ChatActor actor1, ChatActor actor2)>
        {
            (adminActor, operator1Actor),
            (adminActor, operator2Actor)
        };

        for (var i = 0; i < rooms.Count; i++)
        {
            var room = rooms[i];
            var (actor1, actor2) = actorPairs[i];

            members.Add(new ChatRoomMember
            {
                ChatRoomId = room.Id,
                ChatActorId = actor1.Id,
                Role = ChatRoomRole.Member,
                JoinedAt = DateTimeOffset.UtcNow
            });

            members.Add(new ChatRoomMember
            {
                ChatRoomId = room.Id,
                ChatActorId = actor2.Id,
                Role = ChatRoomRole.Member,
                JoinedAt = DateTimeOffset.UtcNow
            });
        }

        return members;
    }
}