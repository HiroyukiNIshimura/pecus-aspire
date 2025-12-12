using Bogus.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Lexical;
using Pecus.Libs.Security;
using Pecus.Libs.Utils;
using System.Reflection;

namespace Pecus.Libs.DB.Seed;

/// <summary>
/// データベースのシードデータを管理するクラス
/// </summary>
public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DatabaseSeeder> _logger;
    private readonly Random _random = new Random();
    private readonly Bogus.Faker _faker;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    public DatabaseSeeder(ApplicationDbContext context, ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _logger = logger;
        _faker = new Bogus.Faker("ja");
    }

    /// <summary>
    /// すべてのシードデータを投入（環境に応じて本番用または開発用）
    /// </summary>
    /// <param name="isDevelopment">開発環境かどうか</param>
    public async Task SeedAllAsync(bool isDevelopment = false)
    {
        _logger.LogInformation(
            "Starting database seeding for {Environment} environment...",
            isDevelopment ? "Development" : "Production"
        );

        // 本番・開発共通のマスターデータ
        await SeedPermissionsAsync();
        await SeedRolesAsync();
        await SeedGenresAsync();
        await SeedTaskTypesAsync();
        await SeedUserSettingsAsync();

        // 組織が既に存在する場合でも設定が欠けていれば補完する
        await SeedOrganizationSettingsAsync();

        // 開発環境のみモックデータを投入
        if (isDevelopment)
        {
            await SeedDevelopmentDataAsync();
        }

        // pgroonga インデックスを再構築（シードデータ投入後に必須）
        await ReindexPgroongaAsync();

        _logger.LogInformation("Database seeding completed successfully");
    }

    /// <summary>
    /// pgroonga インデックスを再構築
    /// </summary>
    /// <remarks>
    /// シードデータ投入後に pgroonga インデックスを再構築することで、
    /// 新しく追加されたデータが検索対象に含まれるようになります。
    /// WorkspaceItems のインデックスは Subject, RawBody, Code を含みます。
    /// </remarks>
    private async Task ReindexPgroongaAsync()
    {
        _logger.LogInformation("Rebuilding pgroonga indexes...");

        try
        {
            // Users テーブルの pgroonga インデックスを再構築
            await _context.Database.ExecuteSqlRawAsync(
                @"REINDEX INDEX CONCURRENTLY idx_users_pgroonga;"
            );

            // WorkspaceItems テーブルの pgroonga インデックスを再構築（Subject, RawBody, Code）
            await _context.Database.ExecuteSqlRawAsync(
                @"REINDEX INDEX CONCURRENTLY idx_workspaceitems_pgroonga;"
            );

            // Skills テーブルの pgroonga インデックスを再構築
            await _context.Database.ExecuteSqlRawAsync(
                @"REINDEX INDEX CONCURRENTLY idx_skills_pgroonga;"
            );

            // Tags テーブルの pgroonga インデックスを再構築
            await _context.Database.ExecuteSqlRawAsync(
                @"REINDEX INDEX CONCURRENTLY idx_tags_pgroonga;"
            );

            _logger.LogInformation("pgroonga indexes rebuilt successfully");
        }
        catch (Exception ex)
        {
            // REINDEX が失敗してもシード処理は継続（pgroonga が利用できない環境を考慮）
            _logger.LogWarning(ex, "Failed to rebuild pgroonga indexes. Search may not work correctly until indexes are rebuilt.");
        }
    }

    /// <summary>
    /// 開発環境用のモックデータを投入
    /// </summary>
    public async Task SeedDevelopmentDataAsync()
    {
        _logger.LogInformation("Seeding development mock data...");

        await SeedOrganizationsAsync();
        await SeedOrganizationSettingsAsync();
        await SeedSkillsAsync();
        await SeedTagsAsync();
        await SeedUsersAsync();
        await SeedUserSettingsAsync();
        await SeedUserSkillsAsync();
        await SeedWorkspacesAsync();
        await SeedWorkspaceSkillsAsync();
        await SeedWorkspaceItemsAsync();
        await SeedWorkspaceItemRelationsAsync();
        await SeedWorkspaceTasksAsync();
        await SeedTaskCommentsAsync();
        await SeedActivitiesAsync();

        _logger.LogInformation("Development mock data seeding completed");
    }

    /// <summary>
    /// 権限のシードデータを投入
    /// </summary>
    public async Task SeedPermissionsAsync()
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

        foreach (var permission in permissions)
        {
            if (!await _context.Permissions.AnyAsync(p => p.Name == permission.Name))
            {
                _context.Permissions.Add(permission);
                _logger.LogInformation("Added permission: {Name}", permission.Name);
            }
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// ロールのシードデータを投入
    /// </summary>
    public async Task SeedRolesAsync()
    {
        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
        if (adminRole == null)
        {
            adminRole = new Role { Name = "Admin", Description = "システム管理者" };
            _context.Roles.Add(adminRole);
            await _context.SaveChangesAsync();

            // すべての権限を割り当て
            var allPermissions = await _context.Permissions.ToListAsync();
            adminRole.Permissions = allPermissions;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added role: Admin with all permissions");
        }

        var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
        if (userRole == null)
        {
            userRole = new Role { Name = "User", Description = "一般ユーザー" };
            _context.Roles.Add(userRole);
            await _context.SaveChangesAsync();

            // 読み取り権限のみを割り当て
            var readPermissions = await _context
                .Permissions.Where(p => p.Name.EndsWith(".Read"))
                .ToListAsync();
            userRole.Permissions = readPermissions;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added role: User with read permissions");
        }

        var backendRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Backend");
        if (backendRole == null)
        {
            backendRole = new Role { Name = "Backend", Description = "バックエンドシステム" };
            _context.Roles.Add(backendRole);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added role: Backend with all permissions");
        }
    }

    /// <summary>
    /// ジャンルのシードデータを投入
    /// </summary>
    public async Task SeedGenresAsync()
    {
        var genres = new[]
        {
            new Genre
            {
                Name = "プロジェクト・開発", // 開発・IT部門の核となるカテゴリ
                Description = "仕様書、設計書、進捗報告",
                Icon = "code", // 開発アイコン
                DisplayOrder = 1,
            },
            new Genre
            {
                Name = "企画・戦略", // 上位の意思決定や提案に関するカテゴリ
                Description = "企画書、提案書、事業計画",
                Icon = "proposal", // 企画・提案アイコン
                DisplayOrder = 2,
            },
            new Genre
            {
                Name = "営業・顧客管理", // 営業、マーケティングの一部を包含
                Description = "営業報告、商談メモ、顧客リスト",
                Icon = "sales", // 営業アイコン
                DisplayOrder = 3,
            },
            new Genre
            {
                Name = "マニュアル・手順", // 知識共有と教育に関するカテゴリ
                Description = "業務手順書、操作マニュアル、FAQ",
                Icon = "manual", // マニュアルアイコン
                DisplayOrder = 4,
            },
            new Genre
            {
                Name = "デザイン・クリエイティブ", // デザイン、広報、マーケティングの一部を包含
                Description = "デザインガイドライン、ワイヤーフレーム、広報資料",
                Icon = "design", // デザインアイコン
                DisplayOrder = 5,
            },

            // --- 組織の「管理業務」に関するドキュメント（全社共通） ---
            new Genre
            {
                Name = "会議・打合せ", // 最も汎用的なカテゴリの一つ
                Description = "議事録、アジェンダ、決定事項",
                Icon = "minutes", // 議事録アイコン
                DisplayOrder = 6,
            },
            new Genre
            {
                Name = "総務・人事・法務", // 管理部門系のドキュメント
                Description = "稟議書、契約書、社内規定、就業規則",
                Icon = "admin", // 管理アイコン
                DisplayOrder = 7,
            },
            new Genre
            {
                Name = "経理・財務",
                Description = "予算申請書、請求書、経費精算",
                Icon = "finance", // 財務アイコン
                DisplayOrder = 8,
            },

            // --- その他の汎用的なドキュメント ---
            new Genre
            {
                Name = "その他・個人メモ",
                Description = "メモ、ToDoリスト、連絡・通知文書",
                Icon = "general", // 一般アイコン
                DisplayOrder = 99,
            },
        };

        foreach (var genre in genres)
        {
            if (!await _context.Genres.AnyAsync(g => g.Name == genre.Name))
            {
                _context.Genres.Add(genre);
                _logger.LogInformation("Added genre: {Name}", genre.Name);
            }
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// タスク種類のシードデータを投入
    /// </summary>
    public async Task SeedTaskTypesAsync()
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

        foreach (var taskType in taskTypes)
        {
            if (!await _context.TaskTypes.AnyAsync(t => t.Code == taskType.Code))
            {
                _context.TaskTypes.Add(taskType);
                _logger.LogInformation("Added task type: {Code} ({Name})", taskType.Code, taskType.Name);
            }
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// スキルのシードデータを投入
    /// </summary>
    public async Task SeedSkillsAsync()
    {
        var organizations = await _context.Organizations.ToListAsync();

        if (!organizations.Any())
        {
            _logger.LogWarning("No organizations found for seeding skills");
            return;
        }

        var skillNames = new[]
        {
            "C#", ".NET", "JavaScript", "TypeScript", "React", "Vue.js", "Angular",
            "Python", "Java", "Go", "Rust", "PHP", "Ruby", "Node.js",
            "SQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch",
            "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes",
            "Git", "GitHub", "GitLab", "Jenkins", "CI/CD",
            "HTML", "CSS", "Webpack", "REST API", "GraphQL",
            "TDD", "OOP", "Design Patterns", "Microservices", "Web API",
            "プロジェクト管理", "スクラム", "アジャイル", "コミュニケーション",
            "デザイン", "UI/UX", "Figma", "Adobe XD", "ライティング",
        };

        int skillsAdded = 0;

        // 各組織にスキルを割り当て
        foreach (var organization in organizations)
        {
            foreach (var skillName in skillNames)
            {
                // スキルが既に存在するかチェック
                var existingSkill = await _context.Skills.FirstOrDefaultAsync(s =>
                    s.Name == skillName && s.OrganizationId == organization.Id
                );

                if (existingSkill == null)
                {
                    var skill = new Skill
                    {
                        Name = skillName,
                        Description = $"{skillName}スキル",
                        OrganizationId = organization.Id,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                    };

                    _context.Skills.Add(skill);
                    skillsAdded++;
                }
            }

            // 組織ごとに保存
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Added {Count} skills for {OrgCount} organizations", skillsAdded, organizations.Count);
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

        int tagsAdded = 0;

        // 各組織にタグを割り当て
        foreach (var organization in organizations)
        {
            // 各組織の最初の Admin ユーザーを取得（または最初のユーザー）
            var adminUser = await _context.Users.FirstOrDefaultAsync(u =>
                u.OrganizationId == organization.Id
            );

            if (adminUser == null)
            {
                _logger.LogWarning("No users found for organization {OrgId}, skipping tag seeding", organization.Id);
                continue;
            }

            foreach (var tagName in tagNames)
            {
                // タグが既に存在するかチェック
                var existingTag = await _context.Tags.FirstOrDefaultAsync(t =>
                    t.Name == tagName && t.OrganizationId == organization.Id
                );

                if (existingTag == null)
                {
                    var tag = new Tag
                    {
                        Name = tagName,
                        OrganizationId = organization.Id,
                        CreatedByUserId = adminUser.Id,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    };

                    _context.Tags.Add(tag);
                    tagsAdded++;
                }
            }

            // 組織ごとに保存
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Added {Count} tags for {OrgCount} organizations", tagsAdded, organizations.Count);
    }

    /// <summary>
    /// 組織のシードデータを投入
    /// </summary>
    public async Task SeedOrganizationsAsync()
    {
        if (!await _context.Organizations.AnyAsync())
        {
            var organizations = new List<Organization>();

            for (int i = 0; i < 5; i++)
            {
                var organization = new Organization
                {
                    Name = _faker.Company.CompanyName().ClampLength(max: 100),
                    Code = $"ORG{(i + 1):D3}",
                    Description = _faker.Company.CatchPhrase().ClampLength(max: 500),
                    RepresentativeName = _faker.Name.LastName().ClampLength(max: 40) + " " + _faker.Name.FirstName().ClampLength(max: 40),
                    PhoneNumber = _faker.Phone.PhoneNumber().ClampLength(max: 20),
                    Email = _faker.Internet.Email("foo").ClampLength(max: 254),
                    IsActive = _random.Next(2) == 1,
                };

                organizations.Add(organization);
                _context.Organizations.Add(organization);
                _logger.LogInformation(
                    "Added organization: {Name} (Code: {Code})",
                    organization.Name,
                    organization.Code
                );
            }

            await _context.SaveChangesAsync();
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
            var organization = await _context.Organizations.FirstOrDefaultAsync();

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

                    _context.Users.Add(normalUser);
                    usersAdded++;

                    if (usersAdded % 50 == 0)
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Added {Count} users", usersAdded);
                    }
                }

                await _context.SaveChangesAsync();

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
                            Description = _faker.Lorem.Sentence(10),
                            OrganizationId = organization.Id,
                            GenreId = genre.Id,
                            IsActive = _random.Next(4) != 0, // 1/4の確率で非アクティブ
                            OwnerId = ownerId,
                            CreatedByUserId = ownerId,
                        };

                        _context.Workspaces.Add(workspace);
                        totalWorkspacesAdded++;

                        if (totalWorkspacesAdded % 50 == 0)
                        {
                            await _context.SaveChangesAsync();
                            _logger.LogInformation("Added {Count} workspaces", totalWorkspacesAdded);
                        }
                    }
                }

                await _context.SaveChangesAsync();
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

        int totalMembersAdded = 0;

        foreach (var workspace in workspaces)
        {
            // このワークスペースの組織に属するユーザーを取得
            var organizationUsers = await _context.Users
                .Where(u => u.OrganizationId == workspace.OrganizationId)
                .ToListAsync();

            if (!organizationUsers.Any())
            {
                continue;
            }

            // すでに存在するメンバーをチェック
            var existingCount = await _context.WorkspaceUsers
                .Where(wu => wu.WorkspaceId == workspace.Id)
                .CountAsync();

            if (existingCount > 0)
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

                var workspaceUser = new WorkspaceUser
                {
                    WorkspaceId = workspace.Id,
                    UserId = user.Id,
                    JoinedAt = DateTime.UtcNow,
                    WorkspaceRole = role,
                };

                _context.WorkspaceUsers.Add(workspaceUser);
                totalMembersAdded++;
            }

            // ワークスペースごとに保存
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Added {Count} workspace members", totalMembersAdded);
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

        int totalWorkspaceSkillsAdded = 0;

        foreach (var workspace in workspaces)
        {
            // このワークスペースの組織に属するスキルを取得
            var organizationSkills = await _context.Skills
                .Where(s => s.OrganizationId == workspace.OrganizationId && s.IsActive)
                .ToListAsync();

            if (!organizationSkills.Any())
            {
                continue;
            }

            // すでにスキルが割り当てられているかチェック
            var existingSkillCount = await _context.WorkspaceSkills
                .Where(ws => ws.WorkspaceId == workspace.Id)
                .CountAsync();

            if (existingSkillCount > 0)
            {
                continue;
            }

            // ランダムに1〜5個のスキルを割り当て
            var skillCount = _random.Next(1, 6);
            var selectedSkills = organizationSkills.OrderBy(x => _random.Next()).Take(skillCount).ToList();

            foreach (var skill in selectedSkills)
            {
                var workspaceSkill = new WorkspaceSkill
                {
                    WorkspaceId = workspace.Id,
                    SkillId = skill.Id,
                    AddedAt = DateTime.UtcNow,
                    AddedByUserId = adminUser.Id,
                };

                _context.WorkspaceSkills.Add(workspaceSkill);
                totalWorkspaceSkillsAdded++;
            }

            // ワークスペースごとに保存
            if (totalWorkspaceSkillsAdded % 50 == 0)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Added {Count} workspace skills", totalWorkspaceSkillsAdded);
            }
        }

        await _context.SaveChangesAsync();
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

        int totalUserSkillsAdded = 0;

        foreach (var user in users)
        {
            // このユーザーの組織に属するスキルを取得
            var organizationSkills = await _context.Skills
                .Where(s => s.OrganizationId == user.OrganizationId && s.IsActive)
                .ToListAsync();

            if (!organizationSkills.Any())
            {
                continue;
            }

            // すでにスキルが割り当てられているかチェック
            var existingSkillCount = await _context.UserSkills
                .Where(us => us.UserId == user.Id)
                .CountAsync();

            if (existingSkillCount > 0)
            {
                continue;
            }

            // ランダムに1〜5個のスキルを割り当て
            var skillCount = _random.Next(1, 6);
            var selectedSkills = organizationSkills.OrderBy(x => _random.Next()).Take(skillCount).ToList();

            foreach (var skill in selectedSkills)
            {
                var userSkill = new UserSkill
                {
                    UserId = user.Id,
                    SkillId = skill.Id,
                    AddedAt = DateTime.UtcNow,
                    AddedByUserId = adminUser.Id, // admin ユーザーの実際の ID を使用
                };

                _context.UserSkills.Add(userSkill);
                totalUserSkillsAdded++;
            }

            // ユーザーごとに保存
            if (totalUserSkillsAdded % 50 == 0)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Added {Count} user skills", totalUserSkillsAdded);
            }
        }

        await _context.SaveChangesAsync();
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

            // playground.json を読み込み
            var playgroundJson = await LoadPlaygroundJsonAsync();
            // シードデータでは RawBody は空文字（実際のデータ投入時に gRPC で生成される）
            var rawBody = string.Empty;

            int totalItemsAdded = 0;
            const int maxTotalItems = 1000; // 全体で最大1000件
            var itemsPerWorkspace = Math.Max(5, maxTotalItems / workspaces.Count); // ワークスペースあたりの件数

            foreach (var workspace in workspaces)
            {
                // 上限チェック
                if (totalItemsAdded >= maxTotalItems)
                {
                    break;
                }

                // このワークスペースのメンバーを取得
                var workspaceMembers = await _context.WorkspaceUsers
                    .Where(wu => wu.WorkspaceId == workspace.Id)
                    .Select(wu => wu.UserId)
                    .ToListAsync();

                if (!workspaceMembers.Any())
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

                    var workspaceItem = new WorkspaceItem
                    {
                        WorkspaceId = workspace.Id,
                        ItemNumber = itemNumber,
                        Code = itemNumber.ToString(),
                        Subject = _faker.Lorem.Paragraphs(1).ClampLength(max: 200),
                        Body = playgroundJson, // playground.json の内容
                        RawBody = rawBody, // LexicalTextExtractor で抽出したプレーンテキスト
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

                    _context.WorkspaceItems.Add(workspaceItem);
                    totalItemsAdded++;

                    // 100件ごとに保存してメモリを節約
                    if (totalItemsAdded % 100 == 0)
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Added {Count} workspace items", totalItemsAdded);
                    }
                }
            }

            await _context.SaveChangesAsync();
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
    /// playground.json ファイルを読み込む
    /// </summary>
    /// <returns>JSON 文字列</returns>
    private static async Task<string> LoadPlaygroundJsonAsync()
    {
        // アセンブリの場所を基準にファイルパスを取得
        var assemblyLocation = Assembly.GetExecutingAssembly().Location;
        var assemblyDirectory = Path.GetDirectoryName(assemblyLocation) ?? string.Empty;

        // 開発時とビルド時で異なるパスを試行
        var possiblePaths = new[]
        {
            // ビルド出力からの相対パス
            Path.Combine(assemblyDirectory, "DB", "Seed", "playground.json"),
            // プロジェクトルートからの相対パス（開発時）
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "pecus.Libs", "DB", "Seed", "playground.json"),
            // 直接参照（開発時のホットリロード用）
            Path.GetFullPath(Path.Combine(assemblyDirectory, "..", "..", "..", "..", "pecus.Libs", "DB", "Seed", "playground.json")),
        };

        foreach (var path in possiblePaths)
        {
            if (File.Exists(path))
            {
                return await File.ReadAllTextAsync(path);
            }
        }

        throw new FileNotFoundException(
            $"playground.json not found. Tried paths: {string.Join(", ", possiblePaths)}"
        );
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

            foreach (var workspace in workspaces)
            {
                // このワークスペースのアイテムを取得
                var workspaceItems = await _context.WorkspaceItems
                    .Where(wi => wi.WorkspaceId == workspace.Id)
                    .Select(wi => wi.Id)
                    .ToListAsync();

                if (workspaceItems.Count < 2)
                {
                    _logger.LogWarning("Not enough items in workspace {WorkspaceId} for creating relations", workspace.Id);
                    continue;
                }

                // 各ワークスペースに10-20件のリレーションを作成
                int relationCount = _random.Next(10, 21);
                int attempts = 0;
                int maxAttempts = relationCount * 3; // 重複を考慮して試行回数を増やす

                while (totalRelationsAdded < relationCount && attempts < maxAttempts)
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

                    // データベース内の既存データをチェック
                    var existingRelation = await _context.WorkspaceItemRelations
                        .AnyAsync(r =>
                            r.FromItemId == fromItemId &&
                            r.ToItemId == toItemId &&
                            r.RelationType == RelationType.Related);

                    if (existingRelation)
                    {
                        continue; // 既に存在する場合はスキップ
                    }

                    var relation = new WorkspaceItemRelation
                    {
                        FromItemId = fromItemId,
                        ToItemId = toItemId,
                        RelationType = RelationType.Related,
                        CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 365)),
                        CreatedByUserId = allCreatedByUsers[_random.Next(allCreatedByUsers.Count)],
                    };

                    _context.WorkspaceItemRelations.Add(relation);
                    addedRelations.Add(relationKey);
                    totalRelationsAdded++;

                    // 50件ごとに保存してメモリを節約
                    if (totalRelationsAdded % 50 == 0)
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Added {Count} workspace item relations", totalRelationsAdded);
                    }
                }
            }

            await _context.SaveChangesAsync();
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
            .Include(wi => wi.Workspace)
            .ToListAsync();

        if (!workspaceItems.Any())
        {
            _logger.LogWarning("No workspace items found for seeding tasks");
            return;
        }

        // タスク種類を取得
        var taskTypes = await _context.TaskTypes.Where(t => t.IsActive).ToListAsync();
        if (!taskTypes.Any())
        {
            _logger.LogWarning("No task types found for seeding tasks");
            return;
        }

        // タスク内容のサンプル
        var taskContents = new[]
        {
            "コードレビューを実施する",
            "ユニットテストを追加する",
            "ドキュメントを更新する",
            "バグを修正する",
            "パフォーマンスを改善する",
            "セキュリティチェックを行う",
            "依存関係を更新する。依存関係を更新する。依存関係を更新する。依存関係を更新する。依存関係を更新する。依存関係を更新する。依存関係を更新する。依存関係を更新する。依存関係を更新する。依存関係を更新する。",
            "リファクタリングを実施する",
            "機能を実装する",
            "デザインを調整する",
            "APIエンドポイントを追加する",
            "データベーススキーマを変更する",
            "設定ファイルを更新する",
            "ログ出力を追加する",
            "エラーハンドリングを改善する",
        };

        var priorities = new TaskPriority?[] { TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.Critical, null };

        int totalTasksAdded = 0;

        foreach (var workspaceItem in workspaceItems)
        {
            // このワークスペースのメンバーを取得
            var workspaceMembers = await _context.WorkspaceUsers
                .Where(wu => wu.WorkspaceId == workspaceItem.WorkspaceId)
                .Select(wu => wu.UserId)
                .ToListAsync();

            if (!workspaceMembers.Any())
            {
                continue;
            }

            // 各アイテムに0〜29件のタスクを作成
            int taskCount = _random.Next(0, 30);

            for (int i = 0; i < taskCount; i++)
            {
                var assignedUserId = workspaceMembers[_random.Next(workspaceMembers.Count)];
                var createdByUserId = workspaceMembers[_random.Next(workspaceMembers.Count)];
                var taskType = taskTypes[_random.Next(taskTypes.Count)];
                var priority = priorities[_random.Next(priorities.Length)];
                var content = taskContents[_random.Next(taskContents.Length)];

                // 開始日と期限日を設定（期限日は必須）
                DateTime? startDate = null;
                DateTimeOffset dueDate;
                if (_random.Next(2) == 1)
                {
                    startDate = DateTime.UtcNow.AddDays(-_random.Next(0, 30));
                    dueDate = new DateTimeOffset(startDate.Value.AddDays(_random.Next(1, 60)), TimeSpan.Zero);
                }
                else
                {
                    // 開始日なしでも期限日は必須
                    dueDate = new DateTimeOffset(DateTime.UtcNow.AddDays(_random.Next(1, 60)), TimeSpan.Zero);
                }

                // 予定工数と実績工数
                decimal? estimatedHours = _random.Next(2) == 1 ? _random.Next(1, 40) : null;
                decimal? actualHours = estimatedHours.HasValue && _random.Next(2) == 1
                    ? Math.Round((decimal)(_random.NextDouble() * (double)estimatedHours.Value * 1.5), 1)
                    : null;

                // 進捗と完了状態
                int progressPercentage = _random.Next(0, 101);
                bool isCompleted = progressPercentage == 100 || _random.Next(10) == 0;
                DateTime? completedAt = isCompleted ? DateTime.UtcNow.AddDays(-_random.Next(0, 30)) : null;

                // 破棄状態（5%の確率）
                bool isDiscarded = !isCompleted && _random.Next(20) == 0;
                DateTime? discardedAt = isDiscarded ? DateTime.UtcNow.AddDays(-_random.Next(0, 30)) : null;
                string? discardReason = isDiscarded ? "優先度変更のためキャンセル" : null;

                var workspaceTask = new WorkspaceTask
                {
                    WorkspaceItemId = workspaceItem.Id,
                    WorkspaceId = workspaceItem.WorkspaceId,
                    OrganizationId = workspaceItem.Workspace!.OrganizationId,
                    AssignedUserId = assignedUserId,
                    CreatedByUserId = createdByUserId,
                    Content = content,
                    TaskTypeId = taskType.Id,
                    Priority = priority,
                    StartDate = startDate,
                    DueDate = dueDate,
                    EstimatedHours = estimatedHours,
                    ActualHours = actualHours,
                    ProgressPercentage = isCompleted ? 100 : progressPercentage,
                    IsCompleted = isCompleted,
                    CompletedAt = completedAt,
                    IsDiscarded = isDiscarded,
                    DiscardedAt = discardedAt,
                    DiscardReason = discardReason,
                    CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 365)),
                    UpdatedAt = DateTime.UtcNow,
                };

                _context.WorkspaceTasks.Add(workspaceTask);
                totalTasksAdded++;

                // 500件ごとに保存してメモリを節約
                if (totalTasksAdded % 500 == 0)
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Added {Count} workspace tasks", totalTasksAdded);
                }
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Added {Count} workspace tasks in total", totalTasksAdded);
    }

    /// <summary>
    /// タスクコメントのシードデータを投入
    /// </summary>
    public async Task SeedTaskCommentsAsync()
    {
        if (await _context.TaskComments.AnyAsync())
        {
            _logger.LogInformation("Task comments already exist, skipping seeding");
            return;
        }

        var workspaceTasks = await _context.WorkspaceTasks
            .Include(t => t.Workspace)
            .ToListAsync();

        if (!workspaceTasks.Any())
        {
            _logger.LogWarning("No workspace tasks found for seeding comments");
            return;
        }

        // コメント内容のサンプル
        var normalComments = new[]
        {
            "了解しました。対応します。",
            "確認しました。",
            "進捗を更新しました。",
            "質問があります。詳細を教えてください。",
            "完了しました。レビューをお願いします。",
            "修正が必要です。",
            "テストを実施しました。問題ありません。",
            "ドキュメントを更新しました。",
            "本日中に対応予定です。",
            "期限を延長してもらえますか？",
            "他のタスクとの依存関係があります。",
            "優先度を上げてください。",
            "関連するIssueを確認してください。",
            "明日のミーティングで確認します。",
            "承認しました。",
        };

        var commentTypes = System.Enum.GetValues<TaskCommentType>();

        int totalCommentsAdded = 0;

        foreach (var task in workspaceTasks)
        {
            // このワークスペースのメンバーを取得
            var workspaceMembers = await _context.WorkspaceUsers
                .Where(wu => wu.WorkspaceId == task.WorkspaceId)
                .Select(wu => wu.UserId)
                .ToListAsync();

            if (!workspaceMembers.Any())
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

                var taskComment = new TaskComment
                {
                    WorkspaceTaskId = task.Id,
                    UserId = userId,
                    Content = content,
                    CommentType = commentType,
                    CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 365)),
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false,
                };

                _context.TaskComments.Add(taskComment);
                totalCommentsAdded++;

                // 500件ごとに保存してメモリを節約
                if (totalCommentsAdded % 500 == 0)
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Added {Count} task comments", totalCommentsAdded);
                }
            }
        }

        await _context.SaveChangesAsync();
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
            .Include(wi => wi.Workspace)
            .ThenInclude(w => w!.WorkspaceUsers)
            .ToListAsync();

        if (!items.Any())
        {
            _logger.LogWarning("No workspace items found for seeding activities");
            return;
        }

        var actionTypes = Enum.GetValues<ActivityActionType>();
        int totalActivitiesAdded = 0;

        foreach (var item in items)
        {
            // 各アイテムに30〜50件のアクティビティを作成
            var activityCount = _random.Next(30, 51);
            var memberIds = item.Workspace?.WorkspaceUsers?.Select(wu => wu.UserId).ToList() ?? [];

            if (memberIds.Count == 0)
            {
                continue;
            }

            // 作成日時を基準に時系列でアクティビティを生成
            var baseDate = item.CreatedAt;

            for (int i = 0; i < activityCount; i++)
            {
                var actionType = i == 0
                    ? ActivityActionType.Created  // 最初は必ず作成
                    : actionTypes[_random.Next(actionTypes.Length)];

                // Created は最初だけなので、それ以外の場合はスキップ
                if (i > 0 && actionType == ActivityActionType.Created)
                {
                    actionType = ActivityActionType.BodyUpdated;
                }

                var userId = memberIds[_random.Next(memberIds.Count)];
                var createdAt = baseDate.AddMinutes(_random.Next(1, 60) * i);

                var activity = new Activity
                {
                    WorkspaceId = item.WorkspaceId,
                    ItemId = item.Id,
                    UserId = userId,
                    ActionType = actionType,
                    Details = GenerateActivityDetails(actionType),
                    CreatedAt = createdAt,
                };

                _context.Activities.Add(activity);
                totalActivitiesAdded++;

                // 1000件ごとに保存してメモリを節約
                if (totalActivitiesAdded % 1000 == 0)
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Added {Count} activities", totalActivitiesAdded);
                }
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Added {Count} activities in total", totalActivitiesAdded);
    }

    /// <summary>
    /// アクティビティのDetailsを生成
    /// </summary>
    private string? GenerateActivityDetails(ActivityActionType actionType)
    {
        return actionType switch
        {
            ActivityActionType.Created => null,
            ActivityActionType.SubjectUpdated => System.Text.Json.JsonSerializer.Serialize(new
            {
                old = _faker.Lorem.Sentence(3),
                @new = _faker.Lorem.Sentence(3)
            }),
            ActivityActionType.BodyUpdated => null, // 本文更新は詳細なし
            ActivityActionType.FileAdded => System.Text.Json.JsonSerializer.Serialize(new
            {
                fileName = _faker.System.FileName(),
                fileSize = _random.Next(1024, 10485760)
            }),
            ActivityActionType.FileRemoved => System.Text.Json.JsonSerializer.Serialize(new
            {
                fileName = _faker.System.FileName()
            }),
            ActivityActionType.AssigneeChanged => System.Text.Json.JsonSerializer.Serialize(new
            {
                old = _random.Next(2) == 0 ? null : _faker.Name.FullName(),
                @new = _faker.Name.FullName()
            }),
            ActivityActionType.RelationAdded => System.Text.Json.JsonSerializer.Serialize(new
            {
                relatedItemCode = _random.Next(1, 100).ToString(),
                relationType = "Related"
            }),
            ActivityActionType.RelationRemoved => System.Text.Json.JsonSerializer.Serialize(new
            {
                relatedItemCode = _random.Next(1, 100).ToString(),
                relationType = "Related"
            }),
            ActivityActionType.ArchivedChanged => System.Text.Json.JsonSerializer.Serialize(new
            {
                @new = _random.Next(2) == 1
            }),
            ActivityActionType.DraftChanged => System.Text.Json.JsonSerializer.Serialize(new
            {
                @new = _random.Next(2) == 1
            }),
            ActivityActionType.CommitterChanged => System.Text.Json.JsonSerializer.Serialize(new
            {
                old = _random.Next(2) == 0 ? null : _faker.Name.FullName(),
                @new = _faker.Name.FullName()
            }),
            ActivityActionType.PriorityChanged => System.Text.Json.JsonSerializer.Serialize(new
            {
                old = "中",
                @new = _random.Next(4) switch { 0 => "低", 1 => "中", 2 => "高", _ => "緊急" }
            }),
            ActivityActionType.DueDateChanged => System.Text.Json.JsonSerializer.Serialize(new
            {
                old = _random.Next(2) == 0 ? null : DateTime.UtcNow.AddDays(-_random.Next(1, 30)).ToString("o"),
                @new = DateTime.UtcNow.AddDays(_random.Next(1, 60)).ToString("o")
            }),
            ActivityActionType.TaskAdded => System.Text.Json.JsonSerializer.Serialize(new
            {
                taskId = _random.Next(1, 1000),
                content = _faker.Lorem.Sentence(5),
                assignee = _faker.Name.FullName()
            }),
            ActivityActionType.TaskCompleted => System.Text.Json.JsonSerializer.Serialize(new
            {
                taskId = _random.Next(1, 1000),
                content = _faker.Lorem.Sentence(5),
                assignee = _faker.Name.FullName(),
                completedBy = _faker.Name.FullName()
            }),
            ActivityActionType.TaskDiscarded => System.Text.Json.JsonSerializer.Serialize(new
            {
                taskId = _random.Next(1, 1000),
                content = _faker.Lorem.Sentence(5),
                assignee = _faker.Name.FullName(),
                discardedBy = _faker.Name.FullName()
            }),
            _ => null
        };
    }
}