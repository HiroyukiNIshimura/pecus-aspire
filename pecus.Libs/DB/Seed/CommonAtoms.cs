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
/// 共通のシードデータ生成
/// TODO 各メソッドでContextは呼び出し側からもらうように変更する
/// </summary>
public class CommonAtoms
{
    private readonly ILogger<CommonAtoms> _logger;
    private readonly ILexicalConverterService? _lexicalConverterService;
    private readonly Random _random = new Random();
    private readonly Bogus.Faker _faker;

    /// <summary>
    ///  Constructor
    /// </summary>
    /// <param name="logger"></param>
    /// <param name="lexicalConverterService"></param>
    public CommonAtoms(
        ILogger<CommonAtoms> logger,
        ILexicalConverterService? lexicalConverterService = null)
    {
        _logger = logger;
        _lexicalConverterService = lexicalConverterService;
        _faker = new Bogus.Faker("ja");
    }

    /// <summary>
    /// 制約とインデックスを一時的に無効化（大量データ投入の高速化）
    /// </summary>
    public async Task DisableConstraintsAndIndexesAsync(ApplicationDbContext context)
    {
        _logger.LogInformation("Starting to disable constraints and indexes");

        var tableNames = new[]
        {
            "Users", "WorkspaceItems", "WorkspaceTasks", "TaskComments", "Activities",
            "Workspaces", "WorkspaceUsers", "Skills", "Tags", "UserSkills",
            "WorkspaceSkills", "WorkspaceItemRelations"
        };

        var disabledCount = 0;
        foreach (var tableName in tableNames)
        {
            try
            {
                _logger.LogDebug("Attempting to disable triggers for table: {TableName}", tableName);
#pragma warning disable EF1002
                await context.Database.ExecuteSqlRawAsync(
                    $@"DO $$
                       BEGIN
                           IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{tableName}') THEN
                               EXECUTE 'ALTER TABLE ""{tableName}"" DISABLE TRIGGER ALL';
                           END IF;
                       END $$;"
                );
#pragma warning restore EF1002
                disabledCount++;
                _logger.LogDebug("Successfully disabled triggers for table: {TableName}", tableName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to disable triggers for table: {TableName}", tableName);
                continue;
            }
        }

        _logger.LogInformation("Completed disabling constraints and indexes for {Count} tables", disabledCount);
    }

    /// <summary>
    /// 制約とインデックスを再有効化
    /// </summary>
    public async Task EnableConstraintsAndIndexesAsync(ApplicationDbContext context)
    {
        _logger.LogInformation("Starting to enable constraints and indexes");

        var tableNames = new[]
        {
            "Users", "WorkspaceItems", "WorkspaceTasks", "TaskComments", "Activities",
            "Workspaces", "WorkspaceUsers", "Skills", "Tags", "UserSkills",
            "WorkspaceSkills", "WorkspaceItemRelations"
        };

        var enabledCount = 0;
        foreach (var tableName in tableNames)
        {
            try
            {
                _logger.LogDebug("Attempting to enable triggers for table: {TableName}", tableName);
#pragma warning disable EF1002
                await context.Database.ExecuteSqlRawAsync(
                    $@"DO $$
                       BEGIN
                           IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{tableName}') THEN
                               EXECUTE 'ALTER TABLE ""{tableName}"" ENABLE TRIGGER ALL';
                           END IF;
                       END $$;"
                );
#pragma warning restore EF1002
                enabledCount++;
                _logger.LogDebug("Successfully enabled triggers for table: {TableName}", tableName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to enable triggers for table: {TableName}", tableName);
                continue;
            }
        }

        _logger.LogInformation("Completed enabling constraints and indexes for {Count} tables", enabledCount);

        _logger.LogInformation("Starting VACUUM ANALYZE");
        await context.Database.ExecuteSqlRawAsync("VACUUM ANALYZE;");
        _logger.LogInformation("Completed VACUUM ANALYZE");
    }

    /// <summary>
    /// pgroonga インデックスを再構築
    /// </summary>
    /// <remarks>
    /// シードデータ投入後に pgroonga インデックスを再構築することで、
    /// 新しく追加されたデータが検索対象に含まれるようになります。
    /// WorkspaceItems のインデックスは Subject, RawBody, Code を含みます。
    /// </remarks>
    public async Task ReindexPgroongaAsync(ApplicationDbContext context)
    {
        _logger.LogInformation("Starting pgroonga index rebuild");

        var originalTimeout = context.Database.GetCommandTimeout();
        context.Database.SetCommandTimeout(90);
        _logger.LogDebug("Set command timeout to 90 seconds (original: {OriginalTimeout})", originalTimeout);

        try
        {
            _logger.LogInformation("Reindexing idx_users_pgroonga");
            await context.Database.ExecuteSqlRawAsync(
                @"REINDEX INDEX CONCURRENTLY idx_users_pgroonga;"
            );
            _logger.LogInformation("Completed reindexing idx_users_pgroonga");

            _logger.LogInformation("Reindexing idx_workspaceitems_pgroonga");
            await context.Database.ExecuteSqlRawAsync(
                @"REINDEX INDEX CONCURRENTLY idx_workspaceitems_pgroonga;"
            );
            _logger.LogInformation("Completed reindexing idx_workspaceitems_pgroonga");

            _logger.LogInformation("Reindexing idx_skills_pgroonga");
            await context.Database.ExecuteSqlRawAsync(
                @"REINDEX INDEX CONCURRENTLY idx_skills_pgroonga;"
            );
            _logger.LogInformation("Completed reindexing idx_skills_pgroonga");

            _logger.LogInformation("Reindexing idx_tags_pgroonga");
            await context.Database.ExecuteSqlRawAsync(
                @"REINDEX INDEX CONCURRENTLY idx_tags_pgroonga;"
            );
            _logger.LogInformation("Completed reindexing idx_tags_pgroonga");

            _logger.LogInformation("Reindexing idx_workspacetasks_content_pgroonga");
            await context.Database.ExecuteSqlRawAsync(
                @"REINDEX INDEX CONCURRENTLY idx_workspacetasks_content_pgroonga;"
            );
            _logger.LogInformation("Completed reindexing idx_workspacetasks_content_pgroonga");

            _logger.LogInformation("Successfully completed all pgroonga index rebuilds");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to rebuild pgroonga indexes");
            throw;
        }
        finally
        {
            context.Database.SetCommandTimeout(originalTimeout);
            _logger.LogDebug("Restored command timeout to {OriginalTimeout}", originalTimeout);
        }
    }

    /// <summary>
    /// 権限のシードデータを投入
    /// </summary>
    public async Task SeedPermissionsAsync(ApplicationDbContext context)
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

        var existingPermissionNames = await context.Permissions
            .Select(p => p.Name)
            .ToHashSetAsync();

        var newPermissions = permissions
            .Where(p => !existingPermissionNames.Contains(p.Name))
            .ToList();

        if (newPermissions.Any())
        {
            context.Permissions.AddRange(newPermissions);
            await context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} permissions", newPermissions.Count);
        }
    }

    /// <summary>
    /// ロールのシードデータを投入
    /// </summary>
    public async Task SeedRolesAsync(ApplicationDbContext context)
    {
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
        if (adminRole == null)
        {
            adminRole = new Role { Name = "Admin", Description = "システム管理者" };
            context.Roles.Add(adminRole);
            await context.SaveChangesAsync();

            // すべての権限を割り当て
            var allPermissions = await context.Permissions.ToListAsync();
            adminRole.Permissions = allPermissions;
            await context.SaveChangesAsync();
            _logger.LogInformation("Added role: Admin with all permissions");
        }

        var userRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
        if (userRole == null)
        {
            userRole = new Role { Name = "User", Description = "一般ユーザー" };
            context.Roles.Add(userRole);
            await context.SaveChangesAsync();

            // 読み取り権限のみを割り当て
            var readPermissions = await context
                .Permissions.Where(p => p.Name.EndsWith(".Read"))
                .ToListAsync();
            userRole.Permissions = readPermissions;
            await context.SaveChangesAsync();
            _logger.LogInformation("Added role: User with read permissions");
        }

        var backendRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Backend");
        if (backendRole == null)
        {
            backendRole = new Role { Name = "Backend", Description = "バックエンドシステム" };
            context.Roles.Add(backendRole);
            await context.SaveChangesAsync();

            _logger.LogInformation("Added role: Backend with all permissions");
        }
    }

    /// <summary>
    /// ジャンルのシードデータを投入
    /// </summary>
    public async Task SeedGenresAsync(ApplicationDbContext context)
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

        var existingGenreNames = await context.Genres
            .Select(g => g.Name)
            .ToHashSetAsync();

        var newGenres = genres
            .Where(g => !existingGenreNames.Contains(g.Name))
            .ToList();

        if (newGenres.Any())
        {
            context.Genres.AddRange(newGenres);
            await context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} genres", newGenres.Count);
        }
    }

    /// <summary>
    /// タスク種類のシードデータを投入
    /// </summary>
    public async Task SeedTaskTypesAsync(ApplicationDbContext context)
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

        var existingTaskTypeCodes = await context.TaskTypes
            .Select(t => t.Code)
            .ToHashSetAsync();

        var newTaskTypes = taskTypes
            .Where(t => !existingTaskTypeCodes.Contains(t.Code))
            .ToList();

        if (newTaskTypes.Any())
        {
            context.TaskTypes.AddRange(newTaskTypes);
            await context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} task types", newTaskTypes.Count);
        }
    }

    /// <summary>
    /// スキルのシードデータを投入
    /// </summary>
    public async Task SeedSkillsAsync(ApplicationDbContext context)
    {
        var organizations = await context.Organizations.ToListAsync();

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
        var existingSkills = await context.Skills
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
            context.Skills.AddRange(newSkills);
            await context.SaveChangesAsync();
            _logger.LogInformation("Added {Count} skills for {OrgCount} organizations", newSkills.Count, organizations.Count);
        }
    }

    /// <summary>
    /// アクティビティのDetailsをPostgreSQLのjsonb_build_object関数呼び出しとして生成
    /// </summary>
    public string GenerateActivityDetailsAsPostgresJsonb(ActivityActionType actionType)
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
    public async Task ExecuteBulkInsertActivitiesAsync(ApplicationDbContext context, List<string> valuesList)
    {
        var valuesClause = string.Join(", ", valuesList);
        var sql = "INSERT INTO \"Activities\" (\"WorkspaceId\", \"ItemId\", \"UserId\", \"ActionType\", \"Details\", \"CreatedAt\") VALUES " + valuesClause;

        await context.Database.ExecuteSqlRawAsync(sql);
    }

    /// <summary>
    /// タスクコメントを生SQLで一括INSERT
    /// </summary>
    public async Task ExecuteBulkInsertTaskCommentsAsync(ApplicationDbContext context, List<string> valuesList)
    {
        var valuesClause = string.Join(", ", valuesList);
        var sql = "INSERT INTO \"TaskComments\" (\"WorkspaceTaskId\", \"UserId\", \"Content\", \"CommentType\", \"CreatedAt\", \"UpdatedAt\", \"IsDeleted\") VALUES " + valuesClause;

        await context.Database.ExecuteSqlRawAsync(sql);
    }

    /// <summary>
    /// ワークスペースタスクを生SQLで一括INSERT
    /// </summary>
    public async Task ExecuteBulkInsertWorkspaceTasksAsync(ApplicationDbContext context, List<string> valuesList)
    {
        var valuesClause = string.Join(", ", valuesList);
        var sql = "INSERT INTO \"WorkspaceTasks\" (\"WorkspaceItemId\", \"WorkspaceId\", \"OrganizationId\", \"Sequence\", \"AssignedUserId\", \"CreatedByUserId\", \"Content\", \"TaskTypeId\", \"Priority\", \"StartDate\", \"DueDate\", \"EstimatedHours\", \"ActualHours\", \"ProgressPercentage\", \"IsCompleted\", \"CompletedAt\", \"IsDiscarded\", \"DiscardedAt\", \"DiscardReason\", \"CreatedAt\", \"UpdatedAt\") VALUES " + valuesClause;

        await context.Database.ExecuteSqlRawAsync(sql);
    }

    /// <summary>
    /// md ディレクトリ内の Markdown ファイルを読み込み、Lexical JSON に変換する
    /// </summary>
    /// <returns>変換結果のリスト (FileName: 拡張子なしファイル名, Body: Lexical JSON, RawBody: プレーンテキスト)</returns>
    public async Task<List<(string FileName, string Body, string RawBody)>> LoadMarkdownFilesAsLexicalJsonAsync()
    {
        var result = new List<(string FileName, string Body, string RawBody)>();

        // アセンブリの場所を基準にファイルパスを取得
        var assemblyLocation = Assembly.GetExecutingAssembly().Location;
        var assemblyDirectory = Path.GetDirectoryName(assemblyLocation) ?? string.Empty;

        // 開発時とビルド時で異なるパスを試行
        var possibleMdDirs = new[]
        {
            // ビルド出力からの相対パス
            Path.Combine(assemblyDirectory, "DB", "Seed", "md"),
            // プロジェクトルートからの相対パス（開発時）
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "pecus.Libs", "DB", "Seed", "md"),
            // 直接参照（開発時のホットリロード用）
            Path.GetFullPath(Path.Combine(assemblyDirectory, "..", "..", "..", "..", "pecus.Libs", "DB", "Seed", "md")),
        };

        string? mdDirectory = null;
        foreach (var path in possibleMdDirs)
        {
            if (Directory.Exists(path))
            {
                mdDirectory = path;
                break;
            }
        }

        if (mdDirectory == null)
        {
            _logger.LogWarning("Markdown directory not found. Tried paths: {Paths}", string.Join(", ", possibleMdDirs));
            return result;
        }

        // Markdown ファイルを取得（INDEX.md を除く、アルファベット順）
        var mdFiles = Directory.GetFiles(mdDirectory, "*.md")
            .Where(f => !Path.GetFileName(f).Equals("INDEX.md", StringComparison.OrdinalIgnoreCase))
            .OrderBy(f => Path.GetFileName(f))
            .ToList();

        if (mdFiles.Count == 0)
        {
            _logger.LogWarning("No markdown files found in {Directory}", mdDirectory);
            return result;
        }

        _logger.LogInformation("Found {Count} markdown files for seeding", mdFiles.Count);

        // _lexicalConverterService が null の場合はフォールバック
        if (_lexicalConverterService == null)
        {
            _logger.LogWarning("LexicalConverterService is not available, using markdown as raw text");
            foreach (var mdFile in mdFiles)
            {
                var markdown = await File.ReadAllTextAsync(mdFile);
                var fileNameWithoutExt = Path.GetFileNameWithoutExtension(mdFile);
                // フォールバック: 空の Lexical JSON とマークダウンをそのまま RawBody に
                result.Add((
                    FileName: fileNameWithoutExt,
                    Body: "{\"root\":{\"children\":[{\"children\":[],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}",
                    RawBody: markdown
                ));
            }
            return result;
        }

        // 各 Markdown ファイルを読み込み、Lexical JSON に変換
        foreach (var mdFile in mdFiles)
        {
            try
            {
                var markdown = await File.ReadAllTextAsync(mdFile);
                var fileName = Path.GetFileName(mdFile);

                // Markdown → Lexical JSON 変換
                var convertResult = await _lexicalConverterService.FromMarkdownAsync(markdown);
                if (!convertResult.Success)
                {
                    _logger.LogWarning(
                        "Failed to convert {FileName} to Lexical JSON: {Error}",
                        fileName,
                        convertResult.ErrorMessage
                    );
                    continue;
                }

                // Lexical JSON → プレーンテキスト変換（RawBody 用）
                var plainTextResult = await _lexicalConverterService.ToPlainTextAsync(convertResult.Result);
                var rawBody = plainTextResult.Success ? plainTextResult.Result : string.Empty;

                var fileNameWithoutExt = Path.GetFileNameWithoutExtension(mdFile);
                result.Add((FileName: fileNameWithoutExt, Body: convertResult.Result, RawBody: rawBody));
                _logger.LogDebug("Converted {FileName} to Lexical JSON ({Length} chars)", fileName, convertResult.Result.Length);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to process markdown file {FileName}", Path.GetFileName(mdFile));
            }
        }

        _logger.LogInformation("Successfully converted {Count} markdown files to Lexical JSON", result.Count);
        return result;
    }

}