using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Security;
using Pecus.Libs.Utils;

namespace Pecus.Libs.DB.Seed;

/// <summary>
/// 本番環境向けのシードデータ生成
/// </summary>
public class ProductAtoms
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductAtoms> _logger;
    private readonly CommonAtoms _seedAtoms;
    private readonly BackOfficeOptions _options;

    /// <summary>
    ///  Constructor
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    /// <param name="seedAtoms"></param>
    /// <param name="options"></param>
    public ProductAtoms(
        ApplicationDbContext context,
        ILogger<ProductAtoms> logger,
        CommonAtoms seedAtoms,
        IOptions<BackOfficeOptions> options)
    {
        _context = context;
        _logger = logger;
        _seedAtoms = seedAtoms;
        _options = options.Value;
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
            //TODO: デモ用データ投入処理を実装
            _logger.LogInformation("Demo mode is enabled. Seeding demo data...");
        }

        _logger.LogInformation("Production data seeding completed");
    }

    /// <summary>
    /// BackOffice関連のデータを1つのトランザクションで投入
    /// </summary>
    private async Task SeedBackOfficeDataAsync()
    {
        var existingOrg = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == _options.Organization.Code);
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

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.Admin);
            var memberRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.User);
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
            Name = _options.Organization.Name,
            Code = _options.Organization.Code,
            PhoneNumber = _options.Organization.PhoneNumber,
            Email = _options.Organization.Email,
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
        var users = new List<User>();
        foreach (var userOption in _options.Users)
        {
            var role = userOption.Role == "Admin" ? adminRole : memberRole;
            var loginId = CodeGenerator.GenerateLoginId();
            var passwordHash = PasswordHasher.HashPassword(userOption.Password);

            var user = new User
            {
                OrganizationId = org.Id,
                Email = userOption.Email,
                Username = userOption.Username,
                LoginId = loginId,
                PasswordHash = passwordHash,
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
        var adminUserOption = _options.Users.FirstOrDefault(u => u.Role == "Admin");
        if (adminUserOption == null) return new List<ChatRoom>();

        var adminUser = users.First(u => u.Email == adminUserOption.Email);
        var operatorUsers = users.Where(u => u.Email != adminUser.Email).ToList();

        var rooms = new List<ChatRoom>();

        foreach (var operatorUser in operatorUsers)
        {
            var minId = Math.Min(adminUser.Id, operatorUser.Id);
            var maxId = Math.Max(adminUser.Id, operatorUser.Id);
            var dmUserPair = $"{minId}_{maxId}";

            var room = new ChatRoom
            {
                OrganizationId = org.Id,
                Type = ChatRoomType.Dm,
                DmUserPair = dmUserPair,
                CreatedByUserId = adminUser.Id,
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
        var members = new List<ChatRoomMember>();

        foreach (var room in rooms)
        {
            if (string.IsNullOrEmpty(room.DmUserPair)) continue;

            var ids = room.DmUserPair.Split('_').Select(long.Parse).ToList();
            if (ids.Count != 2) continue;

            var user1Id = ids[0];
            var user2Id = ids[1];

            var user1Actor = chatActors.FirstOrDefault(a => a.UserId == user1Id);
            var user2Actor = chatActors.FirstOrDefault(a => a.UserId == user2Id);

            if (user1Actor == null || user2Actor == null) continue;

            members.Add(new ChatRoomMember
            {
                ChatRoomId = room.Id,
                ChatActorId = user1Actor.Id,
                Role = ChatRoomRole.Member,
                JoinedAt = DateTimeOffset.UtcNow
            });

            members.Add(new ChatRoomMember
            {
                ChatRoomId = room.Id,
                ChatActorId = user2Actor.Id,
                Role = ChatRoomRole.Member,
                JoinedAt = DateTimeOffset.UtcNow
            });
        }

        return members;
    }
}