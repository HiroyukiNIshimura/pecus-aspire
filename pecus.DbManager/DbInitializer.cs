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

        // pgroonga 拡張とインデックスを有効化
        try
        {
            await EnablePgroongaAsync(dbContext, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "pgroonga extension setup failed. Fuzzy search will use fallback ILIKE.");
            // pgroonga が利用できなくてもアプリケーションは動作するため、例外は再スローしない
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

    /// <summary>
    /// pgroonga 拡張とインデックスを有効化
    /// </summary>
    private async Task EnablePgroongaAsync(ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        logger.LogInformation("Enabling pgroonga extension and creating indexes...");

        // pgroonga 拡張を有効化
        await dbContext.Database.ExecuteSqlRawAsync(
            "CREATE EXTENSION IF NOT EXISTS pgroonga;",
            cancellationToken
        );

        // Users テーブルに pgroonga インデックスを作成（既存の場合はスキップ）
        await dbContext.Database.ExecuteSqlRawAsync(
            @"CREATE INDEX IF NOT EXISTS idx_users_pgroonga
              ON ""Users""
              USING pgroonga ((ARRAY[""Username"", ""Email""])) WITH (tokenizer=""TokenMecab"");",
            cancellationToken
        );

        // WorkspaceItem テーブルに pgroonga インデックスを作成（既存の場合はスキップ）
        await dbContext.Database.ExecuteSqlRawAsync(
            @"CREATE INDEX IF NOT EXISTS idx_workspaceitems_pgroonga
              ON ""WorkspaceItems""
              USING pgroonga ((ARRAY[""Subject"", ""RawBody""])) WITH (tokenizer=""TokenMecab"");",
            cancellationToken
        );

        logger.LogInformation("pgroonga extension and indexes enabled successfully");
    }
}