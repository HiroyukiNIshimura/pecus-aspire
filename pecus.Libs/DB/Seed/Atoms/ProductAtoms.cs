using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Security;
using Pecus.Libs.Utils;

namespace Pecus.Libs.DB.Seed.Atoms;

/// <summary>
/// 本番環境向けのシードデータ生成
/// </summary>
public class ProductAtoms
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductAtoms> _logger;
    private readonly BackOfficeOptions _options;

    /// <summary>
    ///  Constructor
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    /// <param name="options"></param>
    public ProductAtoms(
        ApplicationDbContext context,
        ILogger<ProductAtoms> logger,
        IOptions<BackOfficeOptions> options)
    {
        _context = context;
        _logger = logger;
        _options = options.Value;
    }

    /// <summary>
    /// 本番環境用のデータを投入
    /// </summary>
    /// <returns>作成されたBackOffice組織のID</returns>
    public async Task<long> SeedProductAsync()
    {
        _logger.LogInformation("Seeding production data...");

        await SeedPermissionsAsync();
        await SeedRolesAsync();
        await SeedGenresAsync();
        await SeedTaskTypesAsync();

        var backOfficeOrgId = await SeedBackOfficeDataAsync();

        if (Environment.GetEnvironmentVariable("PECUS_DEMO_MODE") == "true")
        {
            //TODO: デモ用データ投入処理を実装
            _logger.LogInformation("Demo mode is enabled. Seeding demo data...");
        }

        _logger.LogInformation("Production data seeding completed");
        return backOfficeOrgId;
    }

    /// <summary>
    /// BackOffice関連のデータを1つのトランザクションで投入
    /// </summary>
    /// <returns>作成または取得されたBackOffice組織のID</returns>
    private async Task<long> SeedBackOfficeDataAsync()
    {
        var existingOrg = await _context.Organizations.FirstOrDefaultAsync(o => o.Code == _options.Organization.Code);
        if (existingOrg != null)
        {
            _logger.LogInformation("BackOffice organization already exists, updating bots if needed...");
            await UpdateBackOfficeBotsAsync(existingOrg);
            return existingOrg.Id;
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
                throw new InvalidOperationException("Required roles (Admin/User) not found.");
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
            return organization.Id;
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

    /// <summary>
    /// 権限のシードデータを投入
    /// </summary>
    private async Task SeedPermissionsAsync()
    {
        var permissions = new[]
        {
            new Permission
            {
                Name = "User.Read",
                Description = "ユーザー情報の閲覧",
                Category = "User",
            },
            new Permission
            {
                Name = "User.Write",
                Description = "ユーザー情報の編集",
                Category = "User",
            },
            new Permission
            {
                Name = "User.Delete",
                Description = "ユーザーの削除",
                Category = "User",
            },
            new Permission
            {
                Name = "Role.Read",
                Description = "ロール情報の閲覧",
                Category = "Role",
            },
            new Permission
            {
                Name = "Role.Write",
                Description = "ロール情報の編集",
                Category = "Role",
            },
            new Permission
            {
                Name = "Role.Delete",
                Description = "ロールの削除",
                Category = "Role",
            },
            new Permission
            {
                Name = "Organization.Read",
                Description = "組織情報の閲覧",
                Category = "Organization",
            },
            new Permission
            {
                Name = "Organization.Write",
                Description = "組織情報の編集",
                Category = "Organization",
            },
            new Permission
            {
                Name = "Organization.Delete",
                Description = "組織の削除",
                Category = "Organization",
            },
            new Permission
            {
                Name = "Workspace.Read",
                Description = "ワークスペース情報の閲覧",
                Category = "Workspace",
            },
            new Permission
            {
                Name = "Workspace.Write",
                Description = "ワークスペース情報の編集",
                Category = "Workspace",
            },
            new Permission
            {
                Name = "Workspace.Delete",
                Description = "ワークスペースの削除",
                Category = "Workspace",
            },
            new Permission
            {
                Name = "Admin.Access",
                Description = "管理者機能へのアクセス",
                Category = "Admin",
            },
        };

        var existingPermissionNames = await _context.Permissions
            .Select(p => p.Name)
            .ToHashSetAsync();

        var newPermissions = permissions
            .Where(p => !existingPermissionNames.Contains(p.Name))
            .ToList();

        if (newPermissions.Any())
        {
            _context.Permissions.AddRange(newPermissions);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} permissions", newPermissions.Count);
        }
    }

    /// <summary>
    /// ロールのシードデータを投入
    /// </summary>
    private async Task SeedRolesAsync()
    {
        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.Admin);
        if (adminRole == null)
        {
            adminRole = new Role { Name = SystemRole.Admin, Description = "システム管理者" };
            _context.Roles.Add(adminRole);
            await _context.SaveChangesAsync();

            var allPermissions = await _context.Permissions.ToListAsync();
            adminRole.Permissions = allPermissions;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added role: Admin with all permissions");
        }

        var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.User);
        if (userRole == null)
        {
            userRole = new Role { Name = SystemRole.User, Description = "一般ユーザー" };
            _context.Roles.Add(userRole);
            await _context.SaveChangesAsync();

            var readPermissions = await _context
                .Permissions.Where(p => p.Name.EndsWith(".Read"))
                .ToListAsync();
            userRole.Permissions = readPermissions;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added role: User with read permissions");
        }

        var backendRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == SystemRole.BackOffice);
        if (backendRole == null)
        {
            backendRole = new Role { Name = SystemRole.BackOffice, Description = "バックオフィス" };
            _context.Roles.Add(backendRole);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added role: BackOffice with all permissions");
        }
    }

    /// <summary>
    /// ジャンルのシードデータを投入
    /// </summary>
    private async Task SeedGenresAsync()
    {
        var genres = new[]
        {
            new Genre
            {
                Name = "プロジェクト・開発",
                Description = "仕様書、設計書、進捗報告",
                Icon = "code",
                DisplayOrder = 1,
            },
            new Genre
            {
                Name = "企画・戦略",
                Description = "企画書、提案書、事業計画",
                Icon = "proposal",
                DisplayOrder = 2,
            },
            new Genre
            {
                Name = "営業・顧客管理",
                Description = "営業報告、商談メモ、顧客リスト",
                Icon = "sales",
                DisplayOrder = 3,
            },
            new Genre
            {
                Name = "マニュアル・手順",
                Description = "業務手順書、操作マニュアル、FAQ",
                Icon = "manual",
                DisplayOrder = 4,
            },
            new Genre
            {
                Name = "デザイン・クリエイティブ",
                Description = "デザインガイドライン、ワイヤーフレーム、広報資料",
                Icon = "design",
                DisplayOrder = 5,
            },
            new Genre
            {
                Name = "会議・打合せ",
                Description = "議事録、アジェンダ、決定事項",
                Icon = "minutes",
                DisplayOrder = 6,
            },
            new Genre
            {
                Name = "総務・人事・法務",
                Description = "稟議書、契約書、社内規定、就業規則",
                Icon = "admin",
                DisplayOrder = 7,
            },
            new Genre
            {
                Name = "経理・財務",
                Description = "予算申請書、請求書、経費精算",
                Icon = "finance",
                DisplayOrder = 8,
            },
            new Genre
            {
                Name = "その他・個人メモ",
                Description = "メモ、ToDoリスト、連絡・通知文書",
                Icon = "general",
                DisplayOrder = 99,
            },
        };

        var existingGenreNames = await _context.Genres
            .Select(g => g.Name)
            .ToHashSetAsync();

        var newGenres = genres
            .Where(g => !existingGenreNames.Contains(g.Name))
            .ToList();

        if (newGenres.Any())
        {
            _context.Genres.AddRange(newGenres);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} genres", newGenres.Count);
        }
    }

    /// <summary>
    /// タスク種類のシードデータを投入
    /// </summary>
    private async Task SeedTaskTypesAsync()
    {
        var taskTypes = new[]
        {
            new TaskType
            {
                Code = "Bug",
                Name = "バグ修正",
                Description = "不具合の修正作業",
                Icon = "bug",
                DisplayOrder = 1,
            },
            new TaskType
            {
                Code = "Feature",
                Name = "新機能開発",
                Description = "新しい機能の開発作業",
                Icon = "feature",
                DisplayOrder = 2,
            },
            new TaskType
            {
                Code = "Documentation",
                Name = "ドキュメント作成・更新",
                Description = "ドキュメントの作成または更新作業",
                Icon = "documentation",
                DisplayOrder = 3,
            },
            new TaskType
            {
                Code = "Review",
                Name = "レビュー",
                Description = "コードレビューやドキュメントレビュー作業",
                Icon = "review",
                DisplayOrder = 4,
            },
            new TaskType
            {
                Code = "Testing",
                Name = "テスト",
                Description = "テスト作成・実行作業",
                Icon = "testing",
                DisplayOrder = 5,
            },
            new TaskType
            {
                Code = "Refactoring",
                Name = "リファクタリング",
                Description = "コードの改善・整理作業",
                Icon = "refactoring",
                DisplayOrder = 6,
            },
            new TaskType
            {
                Code = "Research",
                Name = "調査・研究",
                Description = "技術調査や研究作業",
                Icon = "research",
                DisplayOrder = 7,
            },
            new TaskType
            {
                Code = "Meeting",
                Name = "打ち合わせ",
                Description = "ミーティングや会議",
                Icon = "meeting",
                DisplayOrder = 8,
            },
            new TaskType
            {
                Code = "BusinessNegotiation",
                Name = "商談",
                Description = "顧客との商談や営業活動",
                Icon = "businessnegotiation",
                DisplayOrder = 9,
            },
            new TaskType
            {
                Code = "RequirementsConfirmation",
                Name = "要件確認",
                Description = "要件の確認・調整作業",
                Icon = "requirementsconfirmation",
                DisplayOrder = 10,
            },
            new TaskType
            {
                Code = "Other",
                Name = "その他",
                Description = "その他のタスク",
                Icon = "other",
                DisplayOrder = 99,
            },
        };

        var existingTaskTypeCodes = await _context.TaskTypes
            .Select(t => t.Code)
            .ToHashSetAsync();

        var newTaskTypes = taskTypes
            .Where(t => !existingTaskTypeCodes.Contains(t.Code))
            .ToList();

        if (newTaskTypes.Any())
        {
            _context.TaskTypes.AddRange(newTaskTypes);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} task types", newTaskTypes.Count);
        }
    }
}