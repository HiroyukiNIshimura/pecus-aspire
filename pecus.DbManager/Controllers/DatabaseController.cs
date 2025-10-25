using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Seed;

namespace Pecus.DbManager.Controllers;

/// <summary>
/// データベース管理用のコントローラー
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DatabaseController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly DatabaseSeeder _seeder;
    private readonly ILogger<DatabaseController> _logger;
    private readonly IWebHostEnvironment _environment;

    public DatabaseController(
        ApplicationDbContext context,
        DatabaseSeeder seeder,
        ILogger<DatabaseController> logger,
        IWebHostEnvironment environment
    )
    {
        _context = context;
        _seeder = seeder;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// データベースをリセットし、すべてのマイグレーションを適用してシードデータを投入
    /// </summary>
    /// <returns>実行結果</returns>
    [HttpPost("reset")]
    public async Task<IActionResult> ResetDatabase()
    {
        try
        {
            _logger.LogWarning("Database reset requested. This will delete all data!");

            // データベースを削除して再作成
            await _context.Database.EnsureDeletedAsync();
            _logger.LogInformation("Database deleted");

            // すべてのマイグレーションを適用
            await _context.Database.MigrateAsync();
            _logger.LogInformation("All migrations applied");

            // シードデータを投入（環境に応じて）
            var isDevelopment = _environment.IsDevelopment();
            await _seeder.SeedAllAsync(isDevelopment);
            _logger.LogInformation(
                "Seed data inserted for {Environment} environment",
                isDevelopment ? "Development" : "Production"
            );

            return Ok(
                new
                {
                    Success = true,
                    Message = "Database reset completed successfully",
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting database");
            return StatusCode(
                500,
                new
                {
                    Success = false,
                    Message = "Error resetting database",
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
    }

    /// <summary>
    /// 未適用のマイグレーションを適用し、未投入のシードデータのみを投入
    /// </summary>
    /// <returns>実行結果</returns>
    [HttpPost("migrate")]
    public async Task<IActionResult> MigrateDatabase()
    {
        try
        {
            _logger.LogInformation("Database migration requested");

            // 保留中のマイグレーションを取得
            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
            var pendingMigrationsList = pendingMigrations.ToList();

            if (!pendingMigrationsList.Any())
            {
                _logger.LogInformation("No pending migrations found");
            }
            else
            {
                _logger.LogInformation(
                    "Found {Count} pending migrations",
                    pendingMigrationsList.Count
                );

                // マイグレーションを適用
                await _context.Database.MigrateAsync();
                _logger.LogInformation("Pending migrations applied");
            }

            // シードデータを投入（環境に応じて、既存データは保持）
            var isDevelopment = _environment.IsDevelopment();
            await _seeder.SeedAllAsync(isDevelopment);
            _logger.LogInformation(
                "Seed data checked and inserted if missing for {Environment} environment",
                isDevelopment ? "Development" : "Production"
            );

            return Ok(
                new
                {
                    Success = true,
                    Message = "Database migration completed successfully",
                    PendingMigrations = pendingMigrationsList,
                    MigrationsApplied = pendingMigrationsList.Count,
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error migrating database");
            return StatusCode(
                500,
                new
                {
                    Success = false,
                    Message = "Error migrating database",
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
    }

    /// <summary>
    /// データベースの状態を確認
    /// </summary>
    /// <returns>データベースの状態情報</returns>
    [HttpGet("status")]
    public async Task<IActionResult> GetDatabaseStatus()
    {
        try
        {
            // データベースが存在するか確認
            var canConnect = await _context.Database.CanConnectAsync();

            if (!canConnect)
            {
                return Ok(
                    new
                    {
                        Success = true,
                        CanConnect = false,
                        Message = "Cannot connect to database",
                        Timestamp = DateTime.UtcNow,
                    }
                );
            }

            // 適用済みのマイグレーション
            var appliedMigrations = await _context.Database.GetAppliedMigrationsAsync();
            var appliedMigrationsList = appliedMigrations.ToList();

            // 保留中のマイグレーション
            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
            var pendingMigrationsList = pendingMigrations.ToList();

            // データ統計
            var userCount = await _context.Users.CountAsync();
            var roleCount = await _context.Roles.CountAsync();
            var permissionCount = await _context.Permissions.CountAsync();
            var organizationCount = await _context.Organizations.CountAsync();
            var workspaceCount = await _context.Workspaces.CountAsync();
            var genreCount = await _context.Genres.CountAsync();

            return Ok(
                new
                {
                    Success = true,
                    CanConnect = canConnect,
                    Database = new
                    {
                        AppliedMigrations = appliedMigrationsList,
                        AppliedMigrationsCount = appliedMigrationsList.Count,
                        PendingMigrations = pendingMigrationsList,
                        PendingMigrationsCount = pendingMigrationsList.Count,
                    },
                    DataStatistics = new
                    {
                        Users = userCount,
                        Roles = roleCount,
                        Permissions = permissionCount,
                        Organizations = organizationCount,
                        Workspaces = workspaceCount,
                        Genres = genreCount,
                    },
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting database status");
            return StatusCode(
                500,
                new
                {
                    Success = false,
                    Message = "Error getting database status",
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
    }

    /// <summary>
    /// シードデータのみを再投入（既存データがない場合のみ）
    /// </summary>
    /// <param name="isDevelopment">開発環境用のモックデータを投入するかどうか（指定しない場合は環境変数から判定）</param>
    /// <returns>実行結果</returns>
    [HttpPost("seed")]
    public async Task<IActionResult> SeedData([FromQuery] bool? isDevelopment = null)
    {
        try
        {
            var useDevelopment = isDevelopment ?? _environment.IsDevelopment();
            _logger.LogInformation(
                "Seed data insertion requested for {Environment} environment",
                useDevelopment ? "Development" : "Production"
            );

            await _seeder.SeedAllAsync(useDevelopment);
            _logger.LogInformation("Seed data checked and inserted if missing");

            return Ok(
                new
                {
                    Success = true,
                    Message = "Seed data insertion completed successfully",
                    Environment = useDevelopment ? "Development" : "Production",
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding data");
            return StatusCode(
                500,
                new
                {
                    Success = false,
                    Message = "Error seeding data",
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
    }

    /// <summary>
    /// 開発環境用のモックデータのみを投入
    /// </summary>
    /// <returns>実行結果</returns>
    [HttpPost("seed/development")]
    public async Task<IActionResult> SeedDevelopmentData()
    {
        try
        {
            _logger.LogInformation("Development mock data insertion requested");

            await _seeder.SeedDevelopmentDataAsync();
            _logger.LogInformation("Development mock data checked and inserted if missing");

            return Ok(
                new
                {
                    Success = true,
                    Message = "Development mock data insertion completed successfully",
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding development data");
            return StatusCode(
                500,
                new
                {
                    Success = false,
                    Message = "Error seeding development data",
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow,
                }
            );
        }
    }
}
