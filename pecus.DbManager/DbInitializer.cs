using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Seed;
using System.Diagnostics;

namespace Pecus.DbManager;

/// <summary>
/// データベースの初期化を行うバックグラウンドサービス
/// </summary>
internal class DbInitializer(
    IServiceProvider serviceProvider,
    IHostEnvironment environment,
    ILogger<DbInitializer> logger
) : BackgroundService
{
    public const string ActivitySourceName = "Migrations";
    private readonly ActivitySource _activitySource = new(ActivitySourceName);

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();

        using var activity = _activitySource.StartActivity(
            "Initializing pecus database",
            ActivityKind.Client
        );

        await InitializeDatabaseAsync(dbContext, seeder, cancellationToken);
    }

    public async Task InitializeDatabaseAsync(
        ApplicationDbContext dbContext,
        DatabaseSeeder seeder,
        CancellationToken cancellationToken = default
    )
    {
        var sw = Stopwatch.StartNew();

        try
        {
            var strategy = dbContext.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(dbContext.Database.MigrateAsync, cancellationToken);
            logger.LogInformation("Database migrations completed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database migration failed. Please check if all migrations are created and applied correctly.");
            throw; // 再スローしてサービスを停止させる
        }

        try
        {
            await SeedAsync(seeder, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database seeding failed. Please check the seeding logic and data.");
            throw; // 再スローしてサービスを停止させる
        }

        logger.LogInformation(
            "Database initialization completed after {ElapsedMilliseconds}ms",
            sw.ElapsedMilliseconds
        );
    }

    private async Task SeedAsync(DatabaseSeeder seeder, CancellationToken cancellationToken)
    {
        logger.LogInformation("Seeding database");

        var isDevelopment = environment.IsDevelopment();
        await seeder.SeedAllAsync(isDevelopment);

        logger.LogInformation("Database seeding completed");
    }
}
