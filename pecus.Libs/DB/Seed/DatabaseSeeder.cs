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
/// 重要！
/// このファイルを編集する前に、必ず docs/DatabaseSeedData.md を確認してください。
/// 作業が済んだら、同ドキュメントも更新し、作業履歴を作成してください。
///
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

        // 開発環境の場合、制約とインデックスを一時的に無効化して高速化
        if (isDevelopment)
        {
            await DisableConstraintsAndIndexesAsync();
        }

        try
        {
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
        }
        finally
        {
            // 制約とインデックスを再有効化
            if (isDevelopment)
            {
                await EnableConstraintsAndIndexesAsync();
            }
        }

        // pgroonga インデックスを再構築（シードデータ投入後に必須）
        await ReindexPgroongaAsync();

        _logger.LogInformation("Database seeding completed successfully");
    }

    /// <summary>
    /// 制約とインデックスを一時的に無効化（大量データ投入の高速化）
    /// </summary>
    private async Task DisableConstraintsAndIndexesAsync()
    {
        _logger.LogInformation("Disabling constraints and indexes for bulk insert...");

        try
        {
            // 存在するテーブルのみトリガー無効化（存在チェック付き）
            // EF Core 規則: パスカルケース複数形（例: WorkspaceItemRelations）
            var tableNames = new[]
            {
                "Users", "WorkspaceItems", "WorkspaceTasks", "TaskComments", "Activities",
                "Workspaces", "WorkspaceUsers", "Skills", "Tags", "UserSkills",
                "WorkspaceSkills", "WorkspaceItemRelations"
            };

            foreach (var tableName in tableNames)
            {
                // テーブルが存在するかチェック
#pragma warning disable EF1002 // テーブル名は定数配列から取得されており安全
                await _context.Database.ExecuteSqlRawAsync(
                    $@"DO $$
                       BEGIN
                           IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{tableName}') THEN
                               EXECUTE 'ALTER TABLE ""{tableName}"" DISABLE TRIGGER ALL';
                           END IF;
                       END $$;"
                );
#pragma warning restore EF1002
            }

            _logger.LogInformation("Constraints and triggers disabled successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to disable some constraints/triggers");
        }
    }

    /// <summary>
    /// 制約とインデックスを再有効化
    /// </summary>
    private async Task EnableConstraintsAndIndexesAsync()
    {
        _logger.LogInformation("Re-enabling constraints and indexes...");

        try
        {
            // 存在するテーブルのみトリガー再有効化（存在チェック付き）
            // EF Core 規則: パスカルケース複数形（例: WorkspaceItemRelations）
            var tableNames = new[]
            {
                "Users", "WorkspaceItems", "WorkspaceTasks", "TaskComments", "Activities",
                "Workspaces", "WorkspaceUsers", "Skills", "Tags", "UserSkills",
                "WorkspaceSkills", "WorkspaceItemRelations"
            };

            foreach (var tableName in tableNames)
            {
                // テーブルが存在するかチェック
#pragma warning disable EF1002 // テーブル名は定数配列から取得されており安全
                await _context.Database.ExecuteSqlRawAsync(
                    $@"DO $$
                       BEGIN
                           IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{tableName}') THEN
                               EXECUTE 'ALTER TABLE ""{tableName}"" ENABLE TRIGGER ALL';
                           END IF;
                       END $$;"
                );
#pragma warning restore EF1002
            }

            // VACUUMとANALYZEで統計情報を更新（クエリプランナーの最適化）
            await _context.Database.ExecuteSqlRawAsync("VACUUM ANALYZE;");

            _logger.LogInformation("Constraints and triggers re-enabled, statistics updated");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to re-enable constraints/triggers");
            throw;
        }
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

        // 既存のスキルを取得（組織ID + 名前の組み合わせ）
        var existingSkills = await _context.Skills
            .Select(s => new { s.OrganizationId, s.Name })
            .ToHashSetAsync();

        var newSkills = new List<Skill>();
        foreach (var organization in organizations)
        {
            foreach (var skillName in skillNames)
            {
                if (!existingSkills.Contains(new { OrganizationId = organization.Id, Name = skillName }))
                {
                    newSkills.Add(new Skill
                    {
                        Name = skillName,
                        Description = $"{skillName}スキル",
                        OrganizationId = organization.Id,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                    });
                }
            }
        }

        if (newSkills.Any())
        {
            _context.Skills.AddRange(newSkills);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} skills for {OrgCount} organizations", newSkills.Count, organizations.Count);
        }
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
            }

            _context.Organizations.AddRange(organizations);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} organizations", organizations.Count);
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
                            Description = _faker.Lorem.Sentence(10),
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

            // playground.json を読み込み
            var playgroundJson = await LoadPlaygroundJsonAsync();
            // シードデータでは RawBody は空文字（実際のデータ投入時に gRPC で生成される）
            var rawBody = string.Empty;

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

        // WorkspaceItemsとWorkspace情報を別々に取得（Includeより高速）
        var workspaceItems = await _context.WorkspaceItems
            .Select(wi => new { wi.Id, wi.WorkspaceId })
            .ToListAsync();

        if (!workspaceItems.Any())
        {
            _logger.LogWarning("No workspace items found for seeding tasks");
            return;
        }

        // WorkspaceIdからOrganizationIdへのマッピングを事前取得
        var workspaceToOrg = await _context.Workspaces
            .Select(w => new { w.Id, w.OrganizationId })
            .ToDictionaryAsync(w => w.Id, w => w.OrganizationId);

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

        // ワークスペースメンバーを事前に取得
        var membersByWorkspace = await _context.WorkspaceUsers
            .GroupBy(wu => wu.WorkspaceId)
            .ToDictionaryAsync(
                g => g.Key,
                g => g.Select(wu => wu.UserId).ToList()
            );

        int totalTasksAdded = 0;
        var valuesList = new List<string>();
        const int batchSize = 5000; // 生SQLなので大きくできる

        foreach (var workspaceItem in workspaceItems)
        {
            if (!membersByWorkspace.TryGetValue(workspaceItem.WorkspaceId, out var workspaceMembers) || !workspaceMembers.Any())
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
                var content = taskContents[_random.Next(taskContents.Length)].Replace("'", "''");

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

                // VALUES句を生成（NULL値の扱いに注意）
                var startDateStr = startDate.HasValue ? "'" + startDate.Value.ToString("yyyy-MM-dd HH:mm:ss") + "'" : "NULL";
                var estimatedHoursStr = estimatedHours.HasValue ? estimatedHours.Value.ToString() : "NULL";
                var actualHoursStr = actualHours.HasValue ? actualHours.Value.ToString() : "NULL";
                var completedAtStr = completedAt.HasValue ? "'" + completedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") + "'" : "NULL";
                var discardedAtStr = discardedAt.HasValue ? "'" + discardedAt.Value.ToString("yyyy-MM-dd HH:mm:ss") + "'" : "NULL";
                var discardReasonStr = discardReason != null ? "'" + discardReason.Replace("'", "''") + "'" : "NULL";
                var priorityStr = priority.HasValue ? ((int)priority.Value).ToString() : "NULL";

                valuesList.Add("(" + workspaceItem.Id + ", " + workspaceItem.WorkspaceId + ", " + workspaceToOrg[workspaceItem.WorkspaceId] + ", " + assignedUserId + ", " + createdByUserId + ", '" + content + "', " + taskType.Id + ", " + priorityStr + ", " + startDateStr + ", '" + dueDate.ToString("yyyy-MM-dd HH:mm:ss+00") + "', " + estimatedHoursStr + ", " + actualHoursStr + ", " + (isCompleted ? 100 : progressPercentage) + ", " + isCompleted.ToString().ToLower() + ", " + completedAtStr + ", " + isDiscarded.ToString().ToLower() + ", " + discardedAtStr + ", " + discardReasonStr + ", '" + createdAt.ToString("yyyy-MM-dd HH:mm:ss") + "', '" + updatedAt.ToString("yyyy-MM-dd HH:mm:ss") + "')");
                totalTasksAdded++;

                if (valuesList.Count >= batchSize)
                {
                    await ExecuteBulkInsertWorkspaceTasksAsync(valuesList);
                    _logger.LogInformation("Added {Count} workspace tasks", totalTasksAdded);
                    valuesList.Clear();
                }
            }
        }

        if (valuesList.Any())
        {
            await ExecuteBulkInsertWorkspaceTasksAsync(valuesList);
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
    /// ワークスペースタスクを生SQLで一括INSERT
    /// </summary>
    private async Task ExecuteBulkInsertWorkspaceTasksAsync(List<string> valuesList)
    {
        var valuesClause = string.Join(", ", valuesList);
        var sql = "INSERT INTO \"WorkspaceTasks\" (\"WorkspaceItemId\", \"WorkspaceId\", \"OrganizationId\", \"AssignedUserId\", \"CreatedByUserId\", \"Content\", \"TaskTypeId\", \"Priority\", \"StartDate\", \"DueDate\", \"EstimatedHours\", \"ActualHours\", \"ProgressPercentage\", \"IsCompleted\", \"CompletedAt\", \"IsDiscarded\", \"DiscardedAt\", \"DiscardReason\", \"CreatedAt\", \"UpdatedAt\") VALUES " + valuesClause;

        await _context.Database.ExecuteSqlRawAsync(sql);
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
                    await ExecuteBulkInsertTaskCommentsAsync(valuesList);
                    _logger.LogInformation("Added {Count} task comments", totalCommentsAdded);
                    valuesList.Clear();
                }
            }
        }

        // 残りを一括INSERT
        if (valuesList.Any())
        {
            await ExecuteBulkInsertTaskCommentsAsync(valuesList);
        }
        _logger.LogInformation("Added {Count} task comments in total", totalCommentsAdded);
    }

    /// <summary>
    /// タスクコメントを生SQLで一括INSERT
    /// </summary>
    private async Task ExecuteBulkInsertTaskCommentsAsync(List<string> valuesList)
    {
        var valuesClause = string.Join(", ", valuesList);
        var sql = "INSERT INTO \"TaskComments\" (\"WorkspaceTaskId\", \"UserId\", \"Content\", \"CommentType\", \"CreatedAt\", \"UpdatedAt\", \"IsDeleted\") VALUES " + valuesClause;

        await _context.Database.ExecuteSqlRawAsync(sql);
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
                var detailsPostgresFunc = GenerateActivityDetailsAsPostgresJsonb(actionType);

                valuesList.Add("(" + item.WorkspaceId + ", " + item.Id + ", " + userId + ", " + (int)actionType + ", " + detailsPostgresFunc + ", '" + createdAt.ToString("yyyy-MM-dd HH:mm:ss") + "')");
                totalActivitiesAdded++;

                if (valuesList.Count >= batchSize)
                {
                    await ExecuteBulkInsertActivitiesAsync(valuesList);
                    _logger.LogInformation("Added {Count} activities", totalActivitiesAdded);
                    valuesList.Clear();
                }
            }
        }

        if (valuesList.Any())
        {
            await ExecuteBulkInsertActivitiesAsync(valuesList);
        }

        _logger.LogInformation("Added {Count} activities in total", totalActivitiesAdded);
    }

    /// <summary>
    /// アクティビティのDetailsをPostgreSQLのjsonb_build_object関数呼び出しとして生成
    /// </summary>
    private string GenerateActivityDetailsAsPostgresJsonb(ActivityActionType actionType)
    {
        string EscapeSql(string value) => value.Replace("'", "''");

        return actionType switch
        {
            ActivityActionType.Created => "NULL",
            ActivityActionType.SubjectUpdated =>
                $"jsonb_build_object('old', '{EscapeSql(_faker.Lorem.Sentence(3))}', 'new', '{EscapeSql(_faker.Lorem.Sentence(3))}')",
            ActivityActionType.BodyUpdated => "NULL",
            ActivityActionType.FileAdded =>
                $"jsonb_build_object('fileName', '{EscapeSql(_faker.System.FileName())}', 'fileSize', {_random.Next(1024, 10485760)})",
            ActivityActionType.FileRemoved =>
                $"jsonb_build_object('fileName', '{EscapeSql(_faker.System.FileName())}')",
            ActivityActionType.AssigneeChanged =>
                _random.Next(2) == 0
                    ? $"jsonb_build_object('old', NULL, 'new', '{EscapeSql(_faker.Name.FullName())}')"
                    : $"jsonb_build_object('old', '{EscapeSql(_faker.Name.FullName())}', 'new', '{EscapeSql(_faker.Name.FullName())}')",
            ActivityActionType.RelationAdded =>
                $"jsonb_build_object('relatedItemCode', '{_random.Next(1, 100)}', 'relationType', 'Related')",
            ActivityActionType.RelationRemoved =>
                $"jsonb_build_object('relatedItemCode', '{_random.Next(1, 100)}', 'relationType', 'Related')",
            ActivityActionType.ArchivedChanged =>
                $"jsonb_build_object('new', {(_random.Next(2) == 1).ToString().ToLower()})",
            ActivityActionType.DraftChanged =>
                $"jsonb_build_object('new', {(_random.Next(2) == 1).ToString().ToLower()})",
            ActivityActionType.CommitterChanged =>
                _random.Next(2) == 0
                    ? $"jsonb_build_object('old', NULL, 'new', '{EscapeSql(_faker.Name.FullName())}')"
                    : $"jsonb_build_object('old', '{EscapeSql(_faker.Name.FullName())}', 'new', '{EscapeSql(_faker.Name.FullName())}')",
            ActivityActionType.PriorityChanged =>
                $"jsonb_build_object('old', '中', 'new', '{(_random.Next(4) switch { 0 => "低", 1 => "中", 2 => "高", _ => "緊急" })}')",
            ActivityActionType.DueDateChanged =>
                _random.Next(2) == 0
                    ? $"jsonb_build_object('old', NULL, 'new', '{DateTime.UtcNow.AddDays(_random.Next(1, 60)):o}')"
                    : $"jsonb_build_object('old', '{DateTime.UtcNow.AddDays(-_random.Next(1, 30)):o}', 'new', '{DateTime.UtcNow.AddDays(_random.Next(1, 60)):o}')",
            ActivityActionType.TaskAdded =>
                $"jsonb_build_object('taskId', {_random.Next(1, 1000)}, 'content', '{EscapeSql(_faker.Lorem.Sentence(5))}', 'assignee', '{EscapeSql(_faker.Name.FullName())}')",
            ActivityActionType.TaskCompleted =>
                $"jsonb_build_object('taskId', {_random.Next(1, 1000)}, 'content', '{EscapeSql(_faker.Lorem.Sentence(5))}', 'assignee', '{EscapeSql(_faker.Name.FullName())}', 'completedBy', '{EscapeSql(_faker.Name.FullName())}')",
            ActivityActionType.TaskDiscarded =>
                $"jsonb_build_object('taskId', {_random.Next(1, 1000)}, 'content', '{EscapeSql(_faker.Lorem.Sentence(5))}', 'assignee', '{EscapeSql(_faker.Name.FullName())}', 'discardedBy', '{EscapeSql(_faker.Name.FullName())}')",
            _ => "NULL"
        };
    }

    /// <summary>
    /// アクティビティを生SQLで一括INSERT
    /// </summary>
    private async Task ExecuteBulkInsertActivitiesAsync(List<string> valuesList)
    {
        var valuesClause = string.Join(", ", valuesList);
        var sql = "INSERT INTO \"Activities\" (\"WorkspaceId\", \"ItemId\", \"UserId\", \"ActionType\", \"Details\", \"CreatedAt\") VALUES " + valuesClause;

        await _context.Database.ExecuteSqlRawAsync(sql);
    }
}