using Bogus.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Lexical;
using Pecus.Libs.Security;
using Pecus.Libs.Utils;
using System.Reflection;

namespace Pecus.Libs.DB.Seed;

/// <summary>
/// 開発者向けのシードデータ生成
/// </summary>
public class LoadTestAtoms
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<LoadTestAtoms> _logger;
    private readonly ILexicalConverterService? _lexicalConverterService;
    private readonly Random _random = new Random();
    private readonly Bogus.Faker _faker;
    private readonly CommonAtoms _seedAtoms;

    /// <summary>
    ///  Constructor
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    /// <param name="seedAtoms"></param>
    /// <param name="lexicalConverterService"></param>
    public LoadTestAtoms(
        ApplicationDbContext context,
        ILogger<LoadTestAtoms> logger,
        CommonAtoms seedAtoms,
        ILexicalConverterService? lexicalConverterService = null)
    {
        _context = context;
        _logger = logger;
        _seedAtoms = seedAtoms;
        _lexicalConverterService = lexicalConverterService;
        _faker = new Bogus.Faker("ja");
    }

    /// <summary>
    /// 負荷確認、開発環境用のモックデータを投入
    /// </summary>
    public async Task SeedDevelopmentDataAsync()
    {
        _logger.LogInformation("Seeding development(LoadTest) mock data...");

        await _seedAtoms.DisableConstraintsAndIndexesAsync();

        try
        {
            await _seedAtoms.SeedPermissionsAsync();
            await _seedAtoms.SeedRolesAsync();
            await _seedAtoms.SeedGenresAsync();
            await _seedAtoms.SeedTaskTypesAsync();
            await SeedOrganizationsAsync();
            await SeedOrganizationSettingsAsync();
            await SeedBotsAsync();
            await _seedAtoms.SeedSkillsAsync();
            await SeedTagsAsync();
            await SeedUsersAsync();
            await SeedChatActorsAsync();
            await SeedUserSettingsAsync();
            await SeedUserSkillsAsync();
            await SeedWorkspacesAsync();
            await SeedChatRoomsAsync();
            await SeedWorkspaceSkillsAsync();
            await SeedWorkspaceItemsAsync();
            await SeedWorkspaceItemRelationsAsync();
            await SeedWorkspaceTasksAsync();
            await SeedTaskCommentsAsync();
            await SeedActivitiesAsync();
        }
        finally
        {
            await _seedAtoms.EnableConstraintsAndIndexesAsync();
            await _seedAtoms.ReindexPgroongaAsync();
        }

        _logger.LogInformation("Development(LoadTest) mock data seeding completed");
    }

    /// <summary>
    /// タグのシードデータを投入
    /// </summary>
    public async Task SeedTagsAsync()
    {
        var organizations = await _context.Organizations.ToListAsync();

        if (!organizations.Any())
        {
            _logger.LogWarning("No organizations found for seeding tags");
            return;
        }

        var tagNames = new[]
        {
            "緊急",
            "重要",
            "開発",
            "デザイン",
            "レビュー待ち",
            "完了",
            "バグ修正",
            "テスト",
            "ドキュメント",
            "定期メンテナンス",
        };

        // 各組織の最初のユーザーを一括取得
        var usersByOrg = await _context.Users
            .Where(u => u.OrganizationId != null)
            .GroupBy(u => u.OrganizationId!.Value)
            .Select(g => new { OrganizationId = g.Key, UserId = g.First().Id })
            .ToDictionaryAsync(x => x.OrganizationId, x => x.UserId);

        // 既存のタグを取得（組織ID + 名前の組み合わせ）
        var existingTags = await _context.Tags
            .Select(t => new { t.OrganizationId, t.Name })
            .ToHashSetAsync();

        var newTags = new List<Tag>();
        foreach (var organization in organizations)
        {
            if (!usersByOrg.TryGetValue(organization.Id, out var userId))
            {
                continue;
            }

            foreach (var tagName in tagNames)
            {
                if (!existingTags.Contains(new { OrganizationId = organization.Id, Name = tagName }))
                {
                    newTags.Add(new Tag
                    {
                        Name = tagName,
                        OrganizationId = organization.Id,
                        CreatedByUserId = userId,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    });
                }
            }
        }

        if (newTags.Any())
        {
            _context.Tags.AddRange(newTags);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} tags for {OrgCount} organizations", newTags.Count, organizations.Count);
        }
    }

    /// <summary>
    /// 組織のシードデータを投入
    /// </summary>
    public async Task SeedOrganizationsAsync()
    {
        if (!await _context.Organizations.AnyAsync())
        {
            var organizations = new List<Organization>();

            for (int i = 0; i < 2; i++)
            {
                var organization = new Organization
                {
                    Name = _faker.Vehicle.Manufacturer().ClampLength(max: 100),
                    Code = $"ORG{(i + 1):D3}",
                    Description = _faker.Company.CatchPhrase().ClampLength(max: 500),
                    RepresentativeName = _faker.Name.LastName().ClampLength(max: 40) + " " + _faker.Name.FirstName().ClampLength(max: 40),
                    PhoneNumber = _faker.Phone.PhoneNumber().ClampLength(max: 20),
                    Email = _faker.Internet.Email("foo").ClampLength(max: 254),
                    IsActive = _random.Next(2) == 1,
                };

                organizations.Add(organization);
            }

            _context.Organizations.AddRange(organizations);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} organizations", organizations.Count);
        }
    }

    /// <summary>
    /// ボットのシードデータを投入
    /// 各組織に ChatBot と SystemBot を作成
    /// </summary>
    public async Task SeedBotsAsync()
    {
        var organizations = await _context.Organizations.ToListAsync();
        if (!organizations.Any())
        {
            _logger.LogInformation("No organizations found, skipping bot seeding");
            return;
        }

        // 既存の Bot を取得して組織ごとに存在チェック
        var existingBots = await _context.Bots.ToListAsync();
        var existingBotsByOrg = existingBots
            .GroupBy(b => b.OrganizationId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var botsToAdd = new List<Bot>();

        foreach (var org in organizations)
        {
            var orgBots = existingBotsByOrg.GetValueOrDefault(org.Id, []);

            // ChatBot が存在しなければ作成
            if (!orgBots.Any(b => b.Type == BotType.ChatBot))
            {
                botsToAdd.Add(new Bot
                {
                    OrganizationId = org.Id,
                    Type = BotType.ChatBot,
                    Name = "Coati Bot",
                    IconUrl = "/icons/bot/chat.webp",
                });
            }

            // SystemBot が存在しなければ作成
            if (!orgBots.Any(b => b.Type == BotType.SystemBot))
            {
                botsToAdd.Add(new Bot
                {
                    OrganizationId = org.Id,
                    Type = BotType.SystemBot,
                    Name = "Butler Bot",
                    IconUrl = "/icons/bot/system.webp",
                });
            }
        }

        if (botsToAdd.Count > 0)
        {
            _context.Bots.AddRange(botsToAdd);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} bots", botsToAdd.Count);
        }
        else
        {
            _logger.LogInformation("All organizations already have bots, skipping creation");
        }

        // 全ての Bot の Persona と Constraint を Type ごとに一括更新
        var chatBotPersona = BotPersonaHelper.GetChatBotPersona();
        var chatBotConstraint = BotPersonaHelper.GetChatBotConstraint();
        var systemBotPersona = BotPersonaHelper.GetSystemBotPersona();
        var systemBotConstraint = BotPersonaHelper.GetSystemBotConstraint();

        var chatBotUpdated = await _context.Bots
            .Where(b => b.Type == BotType.ChatBot)
            .ExecuteUpdateAsync(s => s
                .SetProperty(b => b.Persona, chatBotPersona)
                .SetProperty(b => b.Constraint, chatBotConstraint));

        var systemBotUpdated = await _context.Bots
            .Where(b => b.Type == BotType.SystemBot)
            .ExecuteUpdateAsync(s => s
                .SetProperty(b => b.Persona, systemBotPersona)
                .SetProperty(b => b.Constraint, systemBotConstraint));

        if (chatBotUpdated > 0 || systemBotUpdated > 0)
        {
            _logger.LogInformation("Updated persona and constraint for {ChatBotCount} ChatBots and {SystemBotCount} SystemBots", chatBotUpdated, systemBotUpdated);
        }
    }

    /// <summary>
    /// 組織設定のシードデータを投入（欠損分を補完）
    /// </summary>
    public async Task SeedOrganizationSettingsAsync()
    {
        var organizations = await _context.Organizations.ToListAsync();
        if (!organizations.Any())
        {
            return;
        }

        var existingSettings = await _context.OrganizationSettings
            .ToDictionaryAsync(x => x.OrganizationId, x => x);

        var settingsToAdd = new List<OrganizationSetting>();

        foreach (var organization in organizations)
        {
            if (existingSettings.ContainsKey(organization.Id))
            {
                continue;
            }

            settingsToAdd.Add(
                new OrganizationSetting
                {
                    OrganizationId = organization.Id,
                    TaskOverdueThreshold = 0,
                    WeeklyReportDeliveryDay = 0,
                    MailFromAddress = organization.Email,
                    MailFromName = organization.Name,
                    GenerativeApiVendor = GenerativeApiVendor.None,
                    GenerativeApiKey = null,
                    Plan = OrganizationPlan.Free,
                    DefaultWorkspaceMode = WorkspaceMode.Normal,
                    UpdatedAt = DateTimeOffset.UtcNow,
                    UpdatedByUserId = null,
                }
            );
        }

        if (settingsToAdd.Count > 0)
        {
            _context.OrganizationSettings.AddRange(settingsToAdd);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} organization settings", settingsToAdd.Count);
        }
    }

    /// <summary>
    /// ユーザーのシードデータを投入
    /// </summary>
    public async Task SeedUsersAsync()
    {
        // admin ユーザーを作成（Email で存在チェック）
        if (!await _context.Users.AnyAsync(u => u.Email == "admin@sample.com"))
        {
            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            var organization = await _context.Organizations.OrderBy(o => o.Id).FirstOrDefaultAsync();

            var adminUser = new User
            {
                LoginId = CodeGenerator.GenerateLoginId(),
                Username = "管 理者",
                Email = "admin@sample.com",
                PasswordHash = PasswordHasher.HashPassword("P@ssw0rd"),
                OrganizationId = organization?.Id,
                IsActive = true,
                AvatarType = AvatarType.AutoGenerated,
            };

            _context.Users.Add(adminUser);

            var ordinaryUser1 = new User
            {
                LoginId = CodeGenerator.GenerateLoginId(),
                Username = "一 般人",
                Email = "user1@sample.com",
                PasswordHash = PasswordHasher.HashPassword("P@ssw0rd"),
                OrganizationId = organization?.Id,
                IsActive = true,
                AvatarType = AvatarType.AutoGenerated,
            };

            var ordinaryUser2 = new User
            {
                LoginId = CodeGenerator.GenerateLoginId(),
                Username = "二 般人",
                Email = "user2@sample.com",
                PasswordHash = PasswordHasher.HashPassword("P@ssw0rd"),
                OrganizationId = organization?.Id,
                IsActive = true,
                AvatarType = AvatarType.AutoGenerated,
            };

            _context.Users.Add(adminUser);
            _context.Users.Add(ordinaryUser1);
            _context.Users.Add(ordinaryUser2);
            await _context.SaveChangesAsync();

            if (adminRole != null)
            {
                adminUser.Roles = new List<Role> { adminRole };
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Added admin user: {Username}", adminUser.Username);
        }

        // 一般ユーザーを 200 名作成（ランダムな組織に割り当て）
        // adminを除くユーザー数をカウント
        var existingUserCount = await _context.Users.CountAsync(u => u.Email != "admin@sample.com");
        var usersToCreate = 200 - existingUserCount;

        if (usersToCreate > 0)
        {
            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
            var organizations = await _context.Organizations.ToListAsync();

            if (organizations.Any())
            {
                int usersAdded = 0;
                var userBatch = new List<User>();
                const int batchSize = 500;

                // AutoDetectChanges を無効化してパフォーマンス向上
                var autoDetectChanges = _context.ChangeTracker.AutoDetectChangesEnabled;
                try
                {
                    _context.ChangeTracker.AutoDetectChangesEnabled = false;

                    for (int i = 0; i < usersToCreate; i++)
                    {
                        var loginId = CodeGenerator.GenerateLoginId();
                        // 一意なEmailを生成（連番 + GUID の一部を使用）
                        var email = $"user{existingUserCount + i + 1}_{Guid.NewGuid():N}"[..30] + "@sample.com";

                        // ランダムな組織を選択
                        var organization = organizations[_random.Next(organizations.Count)];

                        var normalUser = new User
                        {
                            LoginId = loginId,
                            Username = _faker.Name.LastName().ClampLength(max: 40) + " " + _faker.Name.FirstName().ClampLength(max: 40),
                            Email = email,
                            PasswordHash = PasswordHasher.HashPassword("P@ssw0rd"),
                            OrganizationId = organization.Id,
                            IsActive = _random.Next(4) != 0, // 1/4の確率で非アクティブ
                            AvatarType = AvatarType.AutoGenerated,
                        };

                        userBatch.Add(normalUser);
                        usersAdded++;

                        if (userBatch.Count >= batchSize)
                        {
                            _context.Users.AddRange(userBatch);
                            await _context.SaveChangesAsync();
                            _logger.LogInformation("Added {Count} users", usersAdded);
                            userBatch.Clear();
                        }
                    }

                    if (userBatch.Any())
                    {
                        _context.Users.AddRange(userBatch);
                        await _context.SaveChangesAsync();
                    }
                }
                finally
                {
                    _context.ChangeTracker.AutoDetectChangesEnabled = autoDetectChanges;
                }

                // ロールを割り当て
                if (userRole != null)
                {
                    var usersToUpdate = await _context.Users
                        .Where(u => u.Email != "admin@sample.com" && !u.Roles.Any())
                        .ToListAsync();

                    foreach (var user in usersToUpdate)
                    {
                        user.Roles = new List<Role> { userRole };
                    }

                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("Added {Count} normal users completed (total: {Total})", usersAdded, existingUserCount + usersAdded);
            }
        }
        else
        {
            _logger.LogInformation("Skipping user seeding, already have {Count} users", existingUserCount);
        }
    }

    /// <summary>
    /// ChatActor のシードデータを投入
    /// User と Bot に対応する ChatActor を作成
    /// </summary>
    private async Task SeedChatActorsAsync()
    {
        var chatActorsToAdd = new List<ChatActor>();

        // 1. ChatActor が未作成のユーザーを取得して作成
        var usersWithoutActor = await _context.Users
            .Where(u => u.OrganizationId != null && !_context.ChatActors.Any(a => a.UserId == u.Id))
            .ToListAsync();

        foreach (var user in usersWithoutActor)
        {
            chatActorsToAdd.Add(new ChatActor
            {
                OrganizationId = user.OrganizationId!.Value,
                ActorType = ChatActorType.User,
                UserId = user.Id,
                DisplayName = user.Username,
                AvatarType = user.AvatarType,
                AvatarUrl = user.UserAvatarPath,
            });
        }

        // 2. ChatActor が未作成のボットを取得して作成
        var botsWithoutActor = await _context.Bots
            .Where(b => !_context.ChatActors.Any(a => a.BotId == b.Id))
            .ToListAsync();

        foreach (var bot in botsWithoutActor)
        {
            chatActorsToAdd.Add(new ChatActor
            {
                OrganizationId = bot.OrganizationId,
                ActorType = ChatActorType.Bot,
                BotId = bot.Id,
                DisplayName = bot.Name,
                AvatarType = null,
                AvatarUrl = bot.IconUrl,
            });
        }

        if (!chatActorsToAdd.Any())
        {
            _logger.LogInformation("All users and bots already have ChatActors, skipping");
            return;
        }

        // バッチ保存
        const int batchSize = 500;
        for (int i = 0; i < chatActorsToAdd.Count; i += batchSize)
        {
            var batch = chatActorsToAdd.Skip(i).Take(batchSize).ToList();
            _context.ChatActors.AddRange(batch);
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation(
            "Added {UserCount} ChatActors for users, {BotCount} ChatActors for bots",
            usersWithoutActor.Count,
            botsWithoutActor.Count
        );
    }

    /// <summary>
    /// ユーザー設定のシードデータを投入（欠損分を補完）
    /// </summary>
    public async Task SeedUserSettingsAsync()
    {
        var users = await _context.Users.ToListAsync();
        if (!users.Any())
        {
            return;
        }

        var existingSettings = await _context.UserSettings.ToDictionaryAsync(x => x.UserId, x => x);
        var settingsToAdd = new List<UserSetting>();

        foreach (var user in users)
        {
            if (existingSettings.ContainsKey(user.Id))
            {
                continue;
            }

            settingsToAdd.Add(
                new UserSetting
                {
                    UserId = user.Id,
                    CanReceiveEmail = true,
                    UpdatedAt = DateTimeOffset.UtcNow,
                    UpdatedByUserId = null,
                }
            );
        }

        if (settingsToAdd.Count > 0)
        {
            _context.UserSettings.AddRange(settingsToAdd);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} user settings", settingsToAdd.Count);
        }
    }

    /// <summary>
    /// ジャンルに合わせたワークスペース説明文を生成
    /// </summary>
    /// <param name="genreName">ジャンル名</param>
    /// <returns>ジャンルに適した説明文</returns>
    private string GenerateWorkspaceDescription(string genreName)
    {
        if (SeedConstants.WorkspaceDescriptionsByGenre.TryGetValue(genreName, out var descriptions))
        {
            return descriptions[_random.Next(descriptions.Length)];
        }

        return "チームでの情報共有とドキュメント管理を行うワークスペースです。";
    }

    /// <summary>
    /// ワークスペースのシードデータを投入
    /// </summary>
    public async Task SeedWorkspacesAsync()
    {
        if (!await _context.Workspaces.AnyAsync())
        {
            var organizations = await _context.Organizations.ToListAsync();
            var genres = await _context.Genres.ToListAsync();

            // 組織ごとのアクティブなユーザーを事前に取得（オーナー候補）
            var usersByOrganization = await _context.Users
                .Where(u => u.OrganizationId != null && u.IsActive)
                .GroupBy(u => u.OrganizationId!.Value)
                .ToDictionaryAsync(g => g.Key, g => g.ToList());

            if (organizations.Any() && genres.Any())
            {
                int totalWorkspacesAdded = 0;

                // 各組織に70件のワークスペースを作成
                var workspaceBatch = new List<Workspace>();
                const int batchSize = 500;

                foreach (var organization in organizations)
                {
                    for (int i = 0; i < 70; i++)
                    {
                        var genre = genres[_random.Next(genres.Count)];

                        // この組織に属するユーザーからOwnerを選択
                        int? ownerId = null;
                        if (usersByOrganization.TryGetValue(organization.Id, out var orgUsers) && orgUsers.Any())
                        {
                            ownerId = orgUsers[_random.Next(orgUsers.Count)].Id;
                        }

                        var workspace = new Workspace
                        {
                            Name = _faker.Music.Genre() + " プロジェクト",
                            Code = CodeGenerator.GenerateWorkspaceCode(),
                            Description = GenerateWorkspaceDescription(genre.Name),
                            OrganizationId = organization.Id,
                            GenreId = genre.Id,
                            Mode = _random.Next(2) == 0 ? WorkspaceMode.Normal : WorkspaceMode.Document,
                            IsActive = _random.Next(4) != 0, // 1/4の確率で非アクティブ
                            OwnerId = ownerId,
                            CreatedByUserId = ownerId,
                        };

                        workspaceBatch.Add(workspace);
                        totalWorkspacesAdded++;

                        if (workspaceBatch.Count >= batchSize)
                        {
                            _context.Workspaces.AddRange(workspaceBatch);
                            await _context.SaveChangesAsync();
                            _logger.LogInformation("Added {Count} workspaces", totalWorkspacesAdded);
                            workspaceBatch.Clear();
                        }
                    }
                }

                if (workspaceBatch.Any())
                {
                    _context.Workspaces.AddRange(workspaceBatch);
                    await _context.SaveChangesAsync();
                }
                _logger.LogInformation("Added {Count} workspaces completed ({WorkspacesPerOrg} per organization)", totalWorkspacesAdded, 70);

                // 各ワークスペースにアイテム連番シーケンスを作成
                var allWorkspaces = await _context.Workspaces.ToListAsync();
                foreach (var ws in allWorkspaces)
                {
                    if (string.IsNullOrEmpty(ws.ItemNumberSequenceName))
                    {
                        var sequenceName = $"workspace_{ws.Id}_item_seq";
#pragma warning disable EF1002 // シーケンス名は識別子のためパラメータ化不可、値はシステム生成で安全
                        await _context.Database.ExecuteSqlRawAsync(
                            $@"CREATE SEQUENCE IF NOT EXISTS ""{sequenceName}"" START WITH 1 INCREMENT BY 1"
                        );
#pragma warning restore EF1002
                        ws.ItemNumberSequenceName = sequenceName;
                    }
                }
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created item number sequences for all workspaces");

                // ワークスペースメンバーを割り当て
                await SeedWorkspaceMembersAsync();
            }
        }
    }

    /// <summary>
    /// ワークスペースメンバーのシードデータを投入
    /// </summary>
    private async Task SeedWorkspaceMembersAsync()
    {
        // キャッシュをクリアして再度読み込み
        _context.ChangeTracker.Clear();

        var workspaces = await _context.Workspaces.ToListAsync();

        if (!workspaces.Any())
        {
            _logger.LogWarning("No workspaces found for seeding members");
            return;
        }

        // 組織ごとのユーザーを事前取得
        var usersByOrganization = await _context.Users
            .Where(u => u.OrganizationId != null)
            .GroupBy(u => u.OrganizationId!.Value)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.ToList()
            );

        // 既存のワークスペースメンバーを取得
        var existingWorkspaceIds = await _context.WorkspaceUsers
            .Select(wu => wu.WorkspaceId)
            .Distinct()
            .ToHashSetAsync();

        int totalMembersAdded = 0;
        var allWorkspaceUsers = new List<WorkspaceUser>();

        foreach (var workspace in workspaces)
        {
            if (existingWorkspaceIds.Contains(workspace.Id))
            {
                continue;
            }

            if (!usersByOrganization.TryGetValue(workspace.OrganizationId, out var organizationUsers) || !organizationUsers.Any())
            {
                continue;
            }

            // 全ユーザーをメンバーに追加
            foreach (var user in organizationUsers)
            {
                // WorkspaceRole を決定: Owner なら Owner、それ以外は Member か Viewer
                WorkspaceRole role;
                if (workspace.OwnerId == user.Id)
                {
                    role = WorkspaceRole.Owner;
                }
                else
                {
                    // Member か Viewer をランダムに割り当て
                    role = _random.Next(2) == 0 ? WorkspaceRole.Member : WorkspaceRole.Viewer;
                }

                allWorkspaceUsers.Add(new WorkspaceUser
                {
                    WorkspaceId = workspace.Id,
                    UserId = user.Id,
                    JoinedAt = DateTime.UtcNow,
                    WorkspaceRole = role,
                });
                totalMembersAdded++;
            }
        }

        // 全ワークスペースメンバーを一括保存
        if (allWorkspaceUsers.Any())
        {
            const int batchSize = 1000;
            for (int i = 0; i < allWorkspaceUsers.Count; i += batchSize)
            {
                var batch = allWorkspaceUsers.Skip(i).Take(batchSize).ToList();
                _context.WorkspaceUsers.AddRange(batch);
                await _context.SaveChangesAsync();
            }
        }

        _logger.LogInformation("Added {Count} workspace members", totalMembersAdded);
    }

    /// <summary>
    /// チャットルームのシードデータを投入
    /// 組織グループチャットとワークスペースグループチャットを作成
    /// </summary>
    private async Task SeedChatRoomsAsync()
    {
        if (await _context.ChatRooms.AnyAsync())
        {
            _logger.LogInformation("ChatRooms already seeded, skipping");
            return;
        }

        _context.ChangeTracker.Clear();

        var organizations = await _context.Organizations.ToListAsync();
        var workspaces = await _context.Workspaces
            .Include(w => w.WorkspaceUsers)
            .ToListAsync();

        // 組織ごとのユーザーを取得
        var usersByOrganization = await _context.Users
            .Where(u => u.OrganizationId != null && u.IsActive)
            .GroupBy(u => u.OrganizationId!.Value)
            .ToDictionaryAsync(g => g.Key, g => g.ToList());

        // UserId → ChatActorId のマッピングを取得
        var userIdToActorId = await _context.ChatActors
            .Where(a => a.UserId != null)
            .ToDictionaryAsync(a => a.UserId!.Value, a => a.Id);

        // BotId → ChatActorId のマッピングを取得
        var botIdToActorId = await _context.ChatActors
            .Where(a => a.BotId != null)
            .ToDictionaryAsync(a => a.BotId!.Value, a => a.Id);

        // 組織ごとの Bot を取得
        var botsByOrganization = await _context.Bots
            .GroupBy(b => b.OrganizationId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList());

        var chatRoomsToAdd = new List<ChatRoom>();
        var chatRoomMembersToAdd = new List<ChatRoomMember>();

        // 1. 組織グループチャットを作成
        foreach (var org in organizations)
        {
            if (!usersByOrganization.TryGetValue(org.Id, out var orgUsers) || !orgUsers.Any())
            {
                continue;
            }

            var ownerUser = orgUsers.First();

            var orgGroupRoom = new ChatRoom
            {
                Type = ChatRoomType.Group,
                Name = org.Name,
                OrganizationId = org.Id,
                WorkspaceId = null,  // 組織グループは WorkspaceId = null
                CreatedByUserId = ownerUser.Id,
            };

            chatRoomsToAdd.Add(orgGroupRoom);
        }

        // 組織グループチャットを保存（ID を取得するため）
        if (chatRoomsToAdd.Any())
        {
            _context.ChatRooms.AddRange(chatRoomsToAdd);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} organization group chat rooms", chatRoomsToAdd.Count);
        }

        // 組織グループチャットのメンバーを追加
        var orgGroupRooms = await _context.ChatRooms
            .Where(r => r.Type == ChatRoomType.Group && r.WorkspaceId == null)
            .ToDictionaryAsync(r => r.OrganizationId, r => r);

        foreach (var org in organizations)
        {
            if (!orgGroupRooms.TryGetValue(org.Id, out var room))
            {
                continue;
            }

            if (!usersByOrganization.TryGetValue(org.Id, out var orgUsers))
            {
                continue;
            }

            var isFirst = true;
            foreach (var user in orgUsers)
            {
                if (!userIdToActorId.TryGetValue(user.Id, out var actorId))
                {
                    continue;
                }

                chatRoomMembersToAdd.Add(new ChatRoomMember
                {
                    ChatRoomId = room.Id,
                    ChatActorId = actorId,
                    Role = isFirst ? ChatRoomRole.Owner : ChatRoomRole.Member,
                });
                isFirst = false;
            }

            // 組織グループチャットに ChatBot を追加
            if (botsByOrganization.TryGetValue(org.Id, out var orgBots))
            {
                var chatBot = orgBots.FirstOrDefault(b => b.Type == BotType.ChatBot);
                if (chatBot != null && botIdToActorId.TryGetValue(chatBot.Id, out var chatBotActorId))
                {
                    chatRoomMembersToAdd.Add(new ChatRoomMember
                    {
                        ChatRoomId = room.Id,
                        ChatActorId = chatBotActorId,
                        Role = ChatRoomRole.Member,
                    });
                }
            }
        }

        // 2. ワークスペースグループチャットを作成
        var workspaceGroupRoomsToAdd = new List<ChatRoom>();

        foreach (var workspace in workspaces)
        {
            if (workspace.OwnerId == null)
            {
                continue;
            }

            var wsGroupRoom = new ChatRoom
            {
                Type = ChatRoomType.Group,
                Name = workspace.Name,
                OrganizationId = workspace.OrganizationId,
                WorkspaceId = workspace.Id,
                CreatedByUserId = workspace.OwnerId.Value,
            };

            workspaceGroupRoomsToAdd.Add(wsGroupRoom);
        }

        // ワークスペースグループチャットを保存
        if (workspaceGroupRoomsToAdd.Any())
        {
            _context.ChatRooms.AddRange(workspaceGroupRoomsToAdd);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} workspace group chat rooms", workspaceGroupRoomsToAdd.Count);
        }

        // ワークスペースグループチャットのメンバーを追加
        var wsGroupRooms = await _context.ChatRooms
            .Where(r => r.Type == ChatRoomType.Group && r.WorkspaceId != null)
            .ToDictionaryAsync(r => r.WorkspaceId!.Value, r => r);

        foreach (var workspace in workspaces)
        {
            if (!wsGroupRooms.TryGetValue(workspace.Id, out var room))
            {
                continue;
            }

            // ワークスペースメンバーをチャットルームメンバーとして追加
            foreach (var wsUser in workspace.WorkspaceUsers)
            {
                if (!userIdToActorId.TryGetValue(wsUser.UserId, out var actorId))
                {
                    continue;
                }

                var role = wsUser.UserId == workspace.OwnerId
                    ? ChatRoomRole.Owner
                    : ChatRoomRole.Member;

                chatRoomMembersToAdd.Add(new ChatRoomMember
                {
                    ChatRoomId = room.Id,
                    ChatActorId = actorId,
                    Role = role,
                });
            }

            // ワークスペースグループチャットに ChatBot を追加
            if (botsByOrganization.TryGetValue(workspace.OrganizationId, out var orgBots))
            {
                var chatBot = orgBots.FirstOrDefault(b => b.Type == BotType.ChatBot);
                if (chatBot != null && botIdToActorId.TryGetValue(chatBot.Id, out var chatBotActorId))
                {
                    chatRoomMembersToAdd.Add(new ChatRoomMember
                    {
                        ChatRoomId = room.Id,
                        ChatActorId = chatBotActorId,
                        Role = ChatRoomRole.Member,
                    });
                }
            }
        }

        // メンバーを一括保存
        if (chatRoomMembersToAdd.Any())
        {
            const int batchSize = 1000;
            for (int i = 0; i < chatRoomMembersToAdd.Count; i += batchSize)
            {
                var batch = chatRoomMembersToAdd.Skip(i).Take(batchSize).ToList();
                _context.ChatRoomMembers.AddRange(batch);
                await _context.SaveChangesAsync();
            }
            _logger.LogInformation("Added {Count} chat room members", chatRoomMembersToAdd.Count);
        }
    }

    /// <summary>
    /// ワークスペースに必要なスキルを割り当て
    /// </summary>
    private async Task SeedWorkspaceSkillsAsync()
    {
        // キャッシュをクリアして再度読み込み
        _context.ChangeTracker.Clear();

        // admin ユーザーを取得（Email で検索）
        var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "admin@sample.com");
        if (adminUser == null)
        {
            _logger.LogWarning("Admin user not found for seeding workspace skills");
            return;
        }

        var workspaces = await _context.Workspaces.ToListAsync();

        if (!workspaces.Any())
        {
            _logger.LogWarning("No workspaces found for seeding skills");
            return;
        }

        // 既存のワークスペーススキルを取得
        var existingWorkspaceIds = await _context.WorkspaceSkills
            .Select(ws => ws.WorkspaceId)
            .Distinct()
            .ToHashSetAsync();

        // 組織ごとのスキルを事前に取得
        var skillsByOrg = await _context.Skills
            .Where(s => s.IsActive)
            .GroupBy(s => s.OrganizationId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.ToList()
            );

        var workspaceSkillBatch = new List<WorkspaceSkill>();
        const int batchSize = 500;
        int totalWorkspaceSkillsAdded = 0;

        foreach (var workspace in workspaces)
        {
            if (existingWorkspaceIds.Contains(workspace.Id))
            {
                continue;
            }

            if (!skillsByOrg.TryGetValue(workspace.OrganizationId, out var organizationSkills) || !organizationSkills.Any())
            {
                continue;
            }

            // ランダムに1〜5個のスキルを割り当て
            var skillCount = _random.Next(1, 6);
            var selectedSkills = organizationSkills.OrderBy(x => _random.Next()).Take(skillCount).ToList();

            foreach (var skill in selectedSkills)
            {
                workspaceSkillBatch.Add(new WorkspaceSkill
                {
                    WorkspaceId = workspace.Id,
                    SkillId = skill.Id,
                    AddedAt = DateTime.UtcNow,
                    AddedByUserId = adminUser.Id,
                });
                totalWorkspaceSkillsAdded++;
            }

            // バッチサイズに達したら保存
            if (workspaceSkillBatch.Count >= batchSize)
            {
                _context.WorkspaceSkills.AddRange(workspaceSkillBatch);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Added {Count} workspace skills", totalWorkspaceSkillsAdded);
                workspaceSkillBatch.Clear();
            }
        }

        if (workspaceSkillBatch.Any())
        {
            _context.WorkspaceSkills.AddRange(workspaceSkillBatch);
            await _context.SaveChangesAsync();
        }
        _logger.LogInformation("Added {Count} workspace skills in total", totalWorkspaceSkillsAdded);
    }

    /// <summary>
    /// ユーザーのスキルを割り当て
    /// </summary>
    private async Task SeedUserSkillsAsync()
    {
        // キャッシュをクリアして再度読み込み
        _context.ChangeTracker.Clear();

        // admin ユーザーを取得（Email で検索）
        var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "admin@sample.com");
        if (adminUser == null)
        {
            _logger.LogWarning("Admin user not found for seeding user skills");
            return;
        }

        var users = await _context.Users.Where(u => u.Email != "admin@sample.com").ToListAsync();

        if (!users.Any())
        {
            _logger.LogWarning("No users found for seeding skills");
            return;
        }

        // 既存のユーザースキルを取得
        var existingUserIds = await _context.UserSkills
            .Select(us => us.UserId)
            .Distinct()
            .ToHashSetAsync();

        // 組織ごとのスキルを事前に取得
        var skillsByOrg = await _context.Skills
            .Where(s => s.IsActive)
            .GroupBy(s => s.OrganizationId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.ToList()
            );

        var userSkillBatch = new List<UserSkill>();
        const int batchSize = 500;
        int totalUserSkillsAdded = 0;

        foreach (var user in users)
        {
            if (existingUserIds.Contains(user.Id))
            {
                continue;
            }

            if (user.OrganizationId == null || !skillsByOrg.TryGetValue(user.OrganizationId.Value, out var organizationSkills) || !organizationSkills.Any())
            {
                continue;
            }

            // ランダムに1〜5個のスキルを割り当て
            var skillCount = _random.Next(1, 6);
            var selectedSkills = organizationSkills.OrderBy(x => _random.Next()).Take(skillCount).ToList();

            foreach (var skill in selectedSkills)
            {
                userSkillBatch.Add(new UserSkill
                {
                    UserId = user.Id,
                    SkillId = skill.Id,
                    AddedAt = DateTime.UtcNow,
                    AddedByUserId = adminUser.Id,
                });
                totalUserSkillsAdded++;
            }

            // バッチサイズに達したら保存
            if (userSkillBatch.Count >= batchSize)
            {
                _context.UserSkills.AddRange(userSkillBatch);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Added {Count} user skills", totalUserSkillsAdded);
                userSkillBatch.Clear();
            }
        }

        if (userSkillBatch.Any())
        {
            _context.UserSkills.AddRange(userSkillBatch);
            await _context.SaveChangesAsync();
        }
        _logger.LogInformation("Added {Count} user skills in total", totalUserSkillsAdded);
    }

    /// <summary>
    /// ワークスペースアイテムのシードデータを投入
    /// </summary>
    public async Task SeedWorkspaceItemsAsync()
    {
        if (!await _context.WorkspaceItems.AnyAsync())
        {
            var workspaces = await _context.Workspaces.ToListAsync();

            if (!workspaces.Any())
            {
                _logger.LogWarning("No workspaces found for seeding workspace items");
                return;
            }

            // Markdown ファイルを読み込んで Lexical JSON に変換
            var bodyDataList = await _seedAtoms.LoadMarkdownFilesAsLexicalJsonAsync();
            if (bodyDataList.Count == 0)
            {
                _logger.LogWarning("No markdown files found for seeding workspace items, using empty body");
                bodyDataList.Add((FileName: "サンプルアイテム", Body: "{\"root\":{\"children\":[{\"children\":[],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}", RawBody: ""));
            }

            int totalItemsAdded = 0;
            const int maxTotalItems = 20000; // 全体で最大20000件
            var itemsPerWorkspace = Math.Max(5, maxTotalItems / workspaces.Count); // ワークスペースあたりの件数
            const int batchSize = 1000; // バッチサイズを大幅に増加

            // ワークスペースメンバーを事前に取得
            var workspaceMembersDict = await _context.WorkspaceUsers
                .GroupBy(wu => wu.WorkspaceId)
                .ToDictionaryAsync(
                    g => g.Key,
                    g => g.Select(wu => wu.UserId).ToList()
                );

            var itemBatch = new List<WorkspaceItem>();

            // AutoDetectChangesを無効化してパフォーマンス向上
            var autoDetectChanges = _context.ChangeTracker.AutoDetectChangesEnabled;
            try
            {
                _context.ChangeTracker.AutoDetectChangesEnabled = false;

                foreach (var workspace in workspaces)
                {
                    // 上限チェック
                    if (totalItemsAdded >= maxTotalItems)
                    {
                        break;
                    }

                    if (!workspaceMembersDict.TryGetValue(workspace.Id, out var workspaceMembers) || !workspaceMembers.Any())
                    {
                        _logger.LogWarning("No members found for workspace {WorkspaceId}, skipping item seeding", workspace.Id);
                        continue;
                    }

                    // ワークスペース内の連番カウンター
                    int itemNumber = 0;

                    // ワークスペースあたりのアイテム数を作成（全体上限あり）
                    var itemsToCreate = Math.Min(itemsPerWorkspace, maxTotalItems - totalItemsAdded);
                    for (int i = 0; i < itemsToCreate; i++)
                    {
                        itemNumber++;
                        var ownerId = workspaceMembers[_random.Next(workspaceMembers.Count)];

                        // bodyDataList から順番に本文を取得（ループ）
                        var bodyData = bodyDataList[totalItemsAdded % bodyDataList.Count];

                        var workspaceItem = new WorkspaceItem
                        {
                            WorkspaceId = workspace.Id,
                            ItemNumber = itemNumber,
                            Code = itemNumber.ToString(),
                            Subject = bodyData.FileName.ClampLength(max: 200), // Markdownファイル名（拡張子なし）
                            Body = bodyData.Body, // Markdown から変換された Lexical JSON
                            RawBody = bodyData.RawBody, // プレーンテキスト
                            OwnerId = ownerId,
                            AssigneeId = _random.Next(2) == 1 ? workspaceMembers[_random.Next(workspaceMembers.Count)] : null,
                            Priority = _random.Next(4) switch
                            {
                                0 => TaskPriority.Low,
                                1 => TaskPriority.Medium,
                                2 => TaskPriority.High,
                                3 => TaskPriority.Critical,
                                _ => null
                            },
                            DueDate = _random.Next(2) == 1 ? DateTime.UtcNow.AddDays(_random.Next(1, 365)) : null, // 50%の確率でNULL、それ以外は1-365日後
                            IsArchived = false,
                            IsDraft = _random.Next(2) == 1,
                            CommitterId = _random.Next(2) == 1 ? workspaceMembers[_random.Next(workspaceMembers.Count)] : null,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 365)), // 過去365日以内のランダムな作成日
                            UpdatedAt = DateTime.UtcNow,
                        };

                        itemBatch.Add(workspaceItem);
                        totalItemsAdded++;

                        // バッチサイズに達したら一括保存
                        if (itemBatch.Count >= batchSize)
                        {
                            _context.WorkspaceItems.AddRange(itemBatch);
                            await _context.SaveChangesAsync();
                            _logger.LogInformation("Added {Count} workspace items", totalItemsAdded);
                            itemBatch.Clear();
                        }
                    }
                }

                // 残りのアイテムを保存
                if (itemBatch.Any())
                {
                    _context.WorkspaceItems.AddRange(itemBatch);
                    await _context.SaveChangesAsync();
                }
            }
            finally
            {
                _context.ChangeTracker.AutoDetectChangesEnabled = autoDetectChanges;
            }
            _logger.LogInformation("Added {Count} workspace items in total", totalItemsAdded);

            // シーケンスを各ワークスペースの最大ItemNumber+1に更新
            foreach (var workspace in workspaces)
            {
                if (!string.IsNullOrEmpty(workspace.ItemNumberSequenceName))
                {
                    var maxItemNumber = await _context.WorkspaceItems
                        .Where(wi => wi.WorkspaceId == workspace.Id)
                        .MaxAsync(wi => (int?)wi.ItemNumber) ?? 0;

                    // アイテムがない場合はスキップ（setvalに0は設定できない）
                    if (maxItemNumber == 0)
                    {
                        continue;
                    }

#pragma warning disable EF1002 // シーケンス名・値はシステム生成で安全
                    await _context.Database.ExecuteSqlRawAsync(
                        $@"SELECT setval('""{workspace.ItemNumberSequenceName}""', {maxItemNumber}, true)"
                    );
#pragma warning restore EF1002
                }
            }
            _logger.LogInformation("Updated item number sequences to current max values");
        }
    }

    /// <summary>
    /// ワークスペースアイテムリレーションのシードデータを投入
    /// </summary>
    public async Task SeedWorkspaceItemRelationsAsync()
    {
        if (!await _context.WorkspaceItemRelations.AnyAsync())
        {
            var workspaces = await _context.Workspaces.ToListAsync();

            if (!workspaces.Any())
            {
                _logger.LogWarning("No workspaces found for seeding workspace item relations");
                return;
            }

            int totalRelationsAdded = 0;
            var allCreatedByUsers = await _context.Users.Select(u => u.Id).ToListAsync();

            // メモリ内で追加予定のリレーションを追跡（重複防止用）
            var addedRelations = new HashSet<(int fromItemId, int toItemId, RelationType? relationType)>();

            // ワークスペースごとのアイテムIDを事前に取得
            var itemsByWorkspace = await _context.WorkspaceItems
                .GroupBy(wi => wi.WorkspaceId)
                .ToDictionaryAsync(
                    g => g.Key,
                    g => g.Select(wi => wi.Id).ToList()
                );

            var relationBatch = new List<WorkspaceItemRelation>();
            const int batchSize = 500;

            foreach (var workspace in workspaces)
            {
                if (!itemsByWorkspace.TryGetValue(workspace.Id, out var workspaceItems) || workspaceItems.Count < 2)
                {
                    _logger.LogWarning("Not enough items in workspace {WorkspaceId} for creating relations", workspace.Id);
                    continue;
                }

                // 各ワークスペースに10-20件のリレーションを作成
                int relationCount = _random.Next(10, 21);
                int created = 0;
                int attempts = 0;
                int maxAttempts = relationCount * 3; // 重複を考慮して試行回数を増やす

                while (created < relationCount && attempts < maxAttempts)
                {
                    attempts++;

                    // ランダムに2つの異なるアイテムを選択
                    var fromItemId = workspaceItems[_random.Next(workspaceItems.Count)];
                    int toItemId;

                    // 同じアイテムを選ばないようにする
                    do
                    {
                        toItemId = workspaceItems[_random.Next(workspaceItems.Count)];
                    } while (toItemId == fromItemId);

                    var relationKey = (fromItemId, toItemId, RelationType.Related);

                    // メモリ内の追加予定リストをチェック
                    if (addedRelations.Contains(relationKey))
                    {
                        continue;
                    }

                    relationBatch.Add(new WorkspaceItemRelation
                    {
                        FromItemId = fromItemId,
                        ToItemId = toItemId,
                        RelationType = RelationType.Related,
                        CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 365)),
                        CreatedByUserId = allCreatedByUsers[_random.Next(allCreatedByUsers.Count)],
                    });
                    addedRelations.Add(relationKey);
                    totalRelationsAdded++;
                    created++;

                    // バッチサイズに達したら保存
                    if (relationBatch.Count >= batchSize)
                    {
                        _context.WorkspaceItemRelations.AddRange(relationBatch);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Added {Count} workspace item relations", totalRelationsAdded);
                        relationBatch.Clear();
                    }
                }
            }

            if (relationBatch.Any())
            {
                _context.WorkspaceItemRelations.AddRange(relationBatch);
                await _context.SaveChangesAsync();
            }
            _logger.LogInformation("Added {Count} workspace item relations in total", totalRelationsAdded);
        }
    }

    /// <summary>
    /// ワークスペースタスクのシードデータを投入
    /// </summary>
    public async Task SeedWorkspaceTasksAsync()
    {
        if (await _context.WorkspaceTasks.AnyAsync())
        {
            _logger.LogInformation("Workspace tasks already exist, skipping seeding");
            return;
        }

        var workspaceItems = await _context.WorkspaceItems
            .Select(wi => new { wi.Id, wi.WorkspaceId })
            .ToListAsync();

        if (!workspaceItems.Any())
        {
            _logger.LogWarning("No workspace items found for seeding tasks");
            return;
        }

        var workspaceToOrg = await _context.Workspaces
            .Select(w => new { w.Id, w.OrganizationId })
            .ToDictionaryAsync(w => w.Id, w => w.OrganizationId);

        var documentModeWorkspaceIds = await _context.Workspaces
            .Where(w => w.Mode == WorkspaceMode.Document)
            .Select(w => w.Id)
            .ToHashSetAsync();

        var taskTypes = await _context.TaskTypes.Where(t => t.IsActive).ToListAsync();
        if (!taskTypes.Any())
        {
            _logger.LogWarning("No task types found for seeding tasks");
            return;
        }

        var taskContents = SeedConstants.TaskContents;

        var priorities = new TaskPriority?[] { TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.Critical, null };

        var membersByWorkspace = await _context.WorkspaceUsers
            .GroupBy(wu => wu.WorkspaceId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.Select(wu => wu.UserId).ToList()
            );

        int totalTasksAdded = 0;
        var valuesList = new List<string>();
        const int batchSize = 5000;

        foreach (var workspaceItem in workspaceItems)
        {
            if (documentModeWorkspaceIds.Contains(workspaceItem.WorkspaceId))
            {
                continue;
            }

            if (!membersByWorkspace.TryGetValue(workspaceItem.WorkspaceId, out var workspaceMembers) || !workspaceMembers.Any())
            {
                continue;
            }

            int taskCount = _random.Next(0, 30);

            for (int i = 0; i < taskCount; i++)
            {
                var assignedUserId = workspaceMembers[_random.Next(workspaceMembers.Count)];
                var createdByUserId = workspaceMembers[_random.Next(workspaceMembers.Count)];
                var taskType = taskTypes[_random.Next(taskTypes.Count)];
                var priority = priorities[_random.Next(priorities.Length)];
                var content = taskContents[_random.Next(taskContents.Length)].Replace("'", "''");

                DateTime? startDate = null;
                DateTimeOffset dueDate;
                if (_random.Next(2) == 1)
                {
                    startDate = DateTime.UtcNow.AddDays(-_random.Next(0, 30));
                    dueDate = new DateTimeOffset(startDate.Value.AddDays(_random.Next(1, 60)), TimeSpan.Zero);
                }
                else
                {
                    dueDate = new DateTimeOffset(DateTime.UtcNow.AddDays(_random.Next(1, 60)), TimeSpan.Zero);
                }

                decimal? estimatedHours = _random.Next(2) == 1 ? _random.Next(1, 40) : null;
                decimal? actualHours = estimatedHours.HasValue && _random.Next(2) == 1
                    ? Math.Round((decimal)(_random.NextDouble() * (double)estimatedHours.Value * 1.5), 1)
                    : null;

                int progressPercentage = _random.Next(0, 101);
                bool isCompleted = progressPercentage == 100 || _random.Next(10) == 0;
                DateTime? completedAt = isCompleted ? DateTime.UtcNow.AddDays(-_random.Next(0, 30)) : null;

                bool isDiscarded = !isCompleted && _random.Next(20) == 0;
                DateTime? discardedAt = isDiscarded ? DateTime.UtcNow.AddDays(-_random.Next(0, 30)) : null;
                string? discardReason = isDiscarded ? "優先度変更のためキャンセル" : null;

                var createdAt = DateTime.UtcNow.AddDays(-_random.Next(0, 365));
                var updatedAt = DateTime.UtcNow;

                var startDateStr = startDate.HasValue ? "'" + startDate.Value.ToString("yyyy-MM-dd HH:mm:ss") + "'" : "NULL";
                var estimatedHoursStr = estimatedHours.HasValue ? estimatedHours.Value.ToString() : "NULL";
                var actualHoursStr = actualHours.HasValue ? actualHours.Value.ToString() : "NULL";
                var completedAtStr = completedAt.HasValue ? "'" + completedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") + "'" : "NULL";
                var discardedAtStr = discardedAt.HasValue ? "'" + discardedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") + "'" : "NULL";
                var discardReasonStr = discardReason != null ? "'" + discardReason.Replace("'", "''") + "'" : "NULL";
                var priorityStr = priority.HasValue ? ((int)priority.Value).ToString() : "NULL";

                var sequence = i + 1;

                valuesList.Add("(" + workspaceItem.Id + ", " + workspaceItem.WorkspaceId + ", " + workspaceToOrg[workspaceItem.WorkspaceId] + ", " + sequence + ", " + assignedUserId + ", " + createdByUserId + ", '" + content + "', " + taskType.Id + ", " + priorityStr + ", " + startDateStr + ", '" + dueDate.ToString("yyyy-MM-dd HH:mm:ss+00") + "', " + estimatedHoursStr + ", " + actualHoursStr + ", " + (isCompleted ? 100 : progressPercentage) + ", " + isCompleted.ToString().ToLower() + ", " + completedAtStr + ", " + isDiscarded.ToString().ToLower() + ", " + discardedAtStr + ", " + discardReasonStr + ", '" + createdAt.ToString("yyyy-MM-dd HH:mm:ss") + "', '" + updatedAt.ToString("yyyy-MM-dd HH:mm:ss") + "')");
                totalTasksAdded++;

                if (valuesList.Count >= batchSize)
                {
                    await _seedAtoms.ExecuteBulkInsertWorkspaceTasksAsync(valuesList);
                    _logger.LogInformation("Added {Count} workspace tasks", totalTasksAdded);
                    valuesList.Clear();
                }
            }
        }

        if (valuesList.Any())
        {
            await _seedAtoms.ExecuteBulkInsertWorkspaceTasksAsync(valuesList);
        }
        _logger.LogInformation("Added {Count} workspace tasks in total", totalTasksAdded);

        // 先行タスクを設定
        await SeedPredecessorTasksAsync();
    }

    /// <summary>
    /// ワークスペースタスクの先行タスクを設定
    /// 同一ワークスペースアイテム内で未完了のタスクに対して、約30%の確率で先行タスクを設定する
    /// </summary>
    private async Task SeedPredecessorTasksAsync()
    {
        _logger.LogInformation("Setting predecessor tasks...");

        // ワークスペースアイテムごとにタスクをグループ化して取得
        var tasksByItem = await _context.WorkspaceTasks
            .Where(t => !t.IsCompleted && !t.IsDiscarded)
            .Select(t => new { t.Id, t.WorkspaceItemId, t.AssignedUserId })
            .ToListAsync();

        var groupedTasks = tasksByItem
            .GroupBy(t => t.WorkspaceItemId)
            .Where(g => g.Count() >= 2) // 2件以上のタスクがあるアイテムのみ対象
            .ToDictionary(g => g.Key, g => g.ToList());

        if (!groupedTasks.Any())
        {
            _logger.LogInformation("No suitable tasks found for setting predecessors");
            return;
        }

        var updateStatements = new List<string>();
        int predecessorsSet = 0;

        foreach (var (workspaceItemId, tasks) in groupedTasks)
        {
            // 同一担当者のタスクをグループ化（先行タスクは同じ担当者のタスク間で設定）
            var tasksByAssignee = tasks
                .GroupBy(t => t.AssignedUserId)
                .Where(g => g.Count() >= 2)
                .ToDictionary(g => g.Key, g => g.Select(t => t.Id).ToList());

            foreach (var (assigneeId, assigneeTasks) in tasksByAssignee)
            {
                // 最初のタスクは先行タスクなし、残りの約30%に先行タスクを設定
                for (int i = 1; i < assigneeTasks.Count; i++)
                {
                    // 30%の確率で先行タスクを設定
                    if (_random.Next(100) < 30)
                    {
                        // 直前のタスクを先行タスクとして設定
                        var predecessorId = assigneeTasks[i - 1];
                        var taskId = assigneeTasks[i];

                        updateStatements.Add($"UPDATE \"WorkspaceTasks\" SET \"PredecessorTaskId\" = {predecessorId} WHERE \"Id\" = {taskId}");
                        predecessorsSet++;

                        // バッチ実行（1000件ごと）
                        if (updateStatements.Count >= 1000)
                        {
                            var batchSql = string.Join("; ", updateStatements);
                            await _context.Database.ExecuteSqlRawAsync(batchSql);
                            _logger.LogInformation("Set {Count} predecessor tasks", predecessorsSet);
                            updateStatements.Clear();
                        }
                    }
                }
            }
        }

        // 残りを実行
        if (updateStatements.Any())
        {
            var batchSql = string.Join("; ", updateStatements);
            await _context.Database.ExecuteSqlRawAsync(batchSql);
        }

        _logger.LogInformation("Set {Count} predecessor tasks in total", predecessorsSet);
    }

    /// <summary>
    /// タスクコメントのシードデータを投入（生SQL使用で高速化）
    /// </summary>
    public async Task SeedTaskCommentsAsync()
    {
        // TaskCommentsが既に存在する場合はスキップ
        if (await _context.TaskComments.AnyAsync())
        {
            _logger.LogInformation("Task comments already seeded, skipping");
            return;
        }

        var workspaceTasks = await _context.WorkspaceTasks
            .Select(wt => new { wt.Id, wt.WorkspaceId })
            .ToListAsync();

        if (!workspaceTasks.Any())
        {
            _logger.LogWarning("No workspace tasks found for seeding comments");
            return;
        }

        // コメント内容のサンプル
        var normalComments = SeedConstants.NormalComments;

        var commentTypes = System.Enum.GetValues<TaskCommentType>();

        // ワークスペースメンバーを事前に取得
        var membersByWorkspace = await _context.WorkspaceUsers
            .GroupBy(wu => wu.WorkspaceId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.Select(wu => wu.UserId).ToList()
            );

        int totalCommentsAdded = 0;
        var valuesList = new List<string>();
        const int batchSize = 5000; // 生SQLなので大きくできる

        foreach (var task in workspaceTasks)
        {
            if (!membersByWorkspace.TryGetValue(task.WorkspaceId, out var workspaceMembers) || !workspaceMembers.Any())
            {
                continue;
            }

            // 各タスクに0〜5件のコメントを作成
            int commentCount = _random.Next(0, 6);

            for (int i = 0; i < commentCount; i++)
            {
                var userId = workspaceMembers[_random.Next(workspaceMembers.Count)];
                var commentType = commentTypes[_random.Next(commentTypes.Length)];

                string content = commentType switch
                {
                    TaskCommentType.Memo => "メモを追加しました。",
                    TaskCommentType.HelpWanted => "助けてください！この問題で詰まっています。",
                    TaskCommentType.NeedReply => "返事をお願いします。",
                    TaskCommentType.Reminder => "進捗はいかがでしょうか？",
                    TaskCommentType.Urge => "至急対応をお願いします。",
                    _ => normalComments[_random.Next(normalComments.Length)],
                };

                var createdAt = DateTime.UtcNow.AddDays(-_random.Next(0, 365));
                var updatedAt = DateTime.UtcNow;

                // エスケープして VALUES 句を生成
                var escapedContent = content.Replace("'", "''");
                valuesList.Add("(" + task.Id + ", " + userId + ", '" + escapedContent + "', " + (int)commentType + ", '" + createdAt.ToString("yyyy-MM-dd HH:mm:ss") + "', '" + updatedAt.ToString("yyyy-MM-dd HH:mm:ss") + "', false)");
                totalCommentsAdded++;

                // バッチサイズに達したら一括INSERT
                if (valuesList.Count >= batchSize)
                {
                    await _seedAtoms.ExecuteBulkInsertTaskCommentsAsync(valuesList);
                    _logger.LogInformation("Added {Count} task comments", totalCommentsAdded);
                    valuesList.Clear();
                }
            }
        }

        // 残りを一括INSERT
        if (valuesList.Any())
        {
            await _seedAtoms.ExecuteBulkInsertTaskCommentsAsync(valuesList);
        }
        _logger.LogInformation("Added {Count} task comments in total", totalCommentsAdded);
    }

    /// <summary>
    /// アクティビティのシードデータを投入（1アイテムに30〜50件）
    /// </summary>
    public async Task SeedActivitiesAsync()
    {
        if (await _context.Activities.AnyAsync())
        {
            _logger.LogInformation("Activities already seeded, skipping");
            return;
        }

        var items = await _context.WorkspaceItems
            .Select(wi => new { wi.Id, wi.WorkspaceId, wi.CreatedAt })
            .ToListAsync();

        if (!items.Any())
        {
            _logger.LogWarning("No workspace items found for seeding activities");
            return;
        }

        // ワークスペースメンバーを事前取得
        var membersByWorkspace = await _context.WorkspaceUsers
            .GroupBy(wu => wu.WorkspaceId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.Select(wu => wu.UserId).ToList()
            );

        var actionTypes = Enum.GetValues<ActivityActionType>();
        int totalActivitiesAdded = 0;
        var valuesList = new List<string>();
        const int batchSize = 5000; // 生SQLなので大きくできる

        foreach (var item in items)
        {
            var activityCount = _random.Next(30, 51);

            if (!membersByWorkspace.TryGetValue(item.WorkspaceId, out var memberIds) || memberIds.Count == 0)
            {
                continue;
            }

            var baseDate = item.CreatedAt;

            for (int i = 0; i < activityCount; i++)
            {
                var actionType = i == 0
                    ? ActivityActionType.Created
                    : actionTypes[_random.Next(actionTypes.Length)];

                if (i > 0 && actionType == ActivityActionType.Created)
                {
                    actionType = ActivityActionType.BodyUpdated;
                }

                var userId = memberIds[_random.Next(memberIds.Count)];
                var createdAt = baseDate.AddMinutes(_random.Next(1, 60) * i);
                var detailsPostgresFunc = _seedAtoms.GenerateActivityDetailsAsPostgresJsonb(actionType);

                valuesList.Add("(" + item.WorkspaceId + ", " + item.Id + ", " + userId + ", " + (int)actionType + ", " + detailsPostgresFunc + ", '" + createdAt.ToString("yyyy-MM-dd HH:mm:ss") + "')");
                totalActivitiesAdded++;

                if (valuesList.Count >= batchSize)
                {
                    await _seedAtoms.ExecuteBulkInsertActivitiesAsync(valuesList);
                    _logger.LogInformation("Added {Count} activities", totalActivitiesAdded);
                    valuesList.Clear();
                }
            }
        }

        if (valuesList.Any())
        {
            await _seedAtoms.ExecuteBulkInsertActivitiesAsync(valuesList);
        }

        _logger.LogInformation("Added {Count} activities in total", totalActivitiesAdded);
    }

}