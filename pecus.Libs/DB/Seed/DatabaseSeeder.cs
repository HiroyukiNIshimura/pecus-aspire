using Faker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Security;

namespace Pecus.Libs.DB.Seed;

/// <summary>
/// データベースのシードデータを管理するクラス
/// </summary>
public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DatabaseSeeder> _logger;
    private readonly Random _random = new Random();

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    public DatabaseSeeder(ApplicationDbContext context, ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _logger = logger;
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

        // 開発環境のみモックデータを投入
        if (isDevelopment)
        {
            await SeedDevelopmentDataAsync();
        }

        _logger.LogInformation("Database seeding completed successfully");
    }

    /// <summary>
    /// 開発環境用のモックデータを投入
    /// </summary>
    public async Task SeedDevelopmentDataAsync()
    {
        _logger.LogInformation("Seeding development mock data...");

        await SeedOrganizationsAsync();
        await SeedUsersAsync();
        await SeedWorkspacesAsync();

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
                Name = "開発",
                Description = "ソフトウェア開発プロジェクト",
                Icon = "code",
                DisplayOrder = 1,
            },
            new Genre
            {
                Name = "デザイン",
                Description = "デザイン関連プロジェクト",
                Icon = "palette",
                DisplayOrder = 2,
            },
            new Genre
            {
                Name = "マーケティング",
                Description = "マーケティング活動",
                Icon = "campaign",
                DisplayOrder = 3,
            },
            new Genre
            {
                Name = "営業",
                Description = "営業活動",
                Icon = "trending_up",
                DisplayOrder = 4,
            },
            new Genre
            {
                Name = "総務",
                Description = "総務・管理業務",
                Icon = "business",
                DisplayOrder = 5,
            },
            new Genre
            {
                Name = "その他",
                Description = "その他のプロジェクト",
                Icon = "folder",
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
                    Name = Company.Name(),
                    Code = $"ORG{(i + 1):D3}",
                    Description = Lorem.Sentence(5),
                    RepresentativeName = Name.FullName(),
                    PhoneNumber = Phone.Number(),
                    Email = Internet.Email(),
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
    /// ユーザーのシードデータを投入
    /// </summary>
    public async Task SeedUsersAsync()
    {
        // admin ユーザーを作成
        if (!await _context.Users.AnyAsync(u => u.LoginId == "admin"))
        {
            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            var organization = await _context.Organizations.FirstOrDefaultAsync();

            var adminUser = new User
            {
                LoginId = "admin",
                Username = "管理者",
                Email = "admin@sample.com",
                PasswordHash = PasswordHasher.HashPassword("admin123"),
                OrganizationId = organization?.Id,
                IsActive = true,
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
        var existingUsers = await _context.Users.Where(u => u.LoginId.StartsWith("user")).CountAsync();
        if (existingUsers < 200)
        {
            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
            var organizations = await _context.Organizations.ToListAsync();

            if (organizations.Any())
            {
                for (int i = 0; i < 200; i++)
                {
                    var loginId = $"user{(i + 1):D3}";

                    // すでに存在するか確認
                    if (await _context.Users.AnyAsync(u => u.LoginId == loginId))
                    {
                        continue;
                    }

                    // ランダムな組織を選択
                    var organization = organizations[_random.Next(organizations.Count)];

                    var normalUser = new User
                    {
                        LoginId = loginId,
                        Username = Name.FullName(),
                        Email = Internet.Email(),
                        PasswordHash = PasswordHasher.HashPassword("user123"),
                        OrganizationId = organization.Id,
                        IsActive = _random.Next(2) == 1,
                    };

                    _context.Users.Add(normalUser);

                    if ((i + 1) % 50 == 0)
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Added {Count} users", i + 1);
                    }
                }

                await _context.SaveChangesAsync();

                // ロールを割り当て
                if (userRole != null)
                {
                    var usersToUpdate = await _context.Users
                        .Where(u => u.LoginId.StartsWith("user") && !u.Roles.Any())
                        .ToListAsync();

                    foreach (var user in usersToUpdate)
                    {
                        user.Roles = new List<Role> { userRole };
                    }

                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("Added 200 normal users completed");
            }
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

            if (organizations.Any() && genres.Any())
            {
                for (int i = 0; i < 100; i++)
                {
                    // ランダムな組織とジャンルを選択
                    var organization = organizations[_random.Next(organizations.Count)];
                    var genre = genres[_random.Next(genres.Count)];

                    var workspace = new Workspace
                    {
                        Name = Company.Name() + " プロジェクト",
                        Code = $"PROJ{(i + 1):D3}",
                        Description = Lorem.Sentence(10),
                        OrganizationId = organization.Id,
                        GenreId = genre.Id,
                        IsActive = _random.Next(2) == 1,
                    };

                    _context.Workspaces.Add(workspace);

                    if ((i + 1) % 20 == 0)
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Added {Count} workspaces", i + 1);
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Added 100 workspaces completed");
            }
        }
    }
}
