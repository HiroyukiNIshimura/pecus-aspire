using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Seed;

var builder = WebApplication.CreateBuilder(args);

// DbContextの登録 - Aspireの接続文字列を使用
builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb");

// DatabaseSeederの登録
builder.Services.AddScoped<DatabaseSeeder>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "Pecus Database Manager API",
            Version = "v1",
            Description = "データベースのマイグレーションとシードデータ管理用API",
        }
    );
});

var app = builder.Build();

// 起動時にマイグレーションを自動適用
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("Starting database migration...");

        var context = services.GetRequiredService<ApplicationDbContext>();

        // 保留中のマイグレーションを確認
        var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
        var pendingMigrationsList = pendingMigrations.ToList();

        if (pendingMigrationsList.Any())
        {
            logger.LogInformation(
                "Found {Count} pending migrations. Applying...",
                pendingMigrationsList.Count
            );
            foreach (var migration in pendingMigrationsList)
            {
                logger.LogInformation("  - {Migration}", migration);
            }

            // マイグレーションを適用
            await context.Database.MigrateAsync();
            logger.LogInformation("Database migration completed successfully");
        }
        else
        {
            logger.LogInformation("No pending migrations found. Database is up to date.");
        }

        // シードデータを投入（環境に応じて）
        var seeder = services.GetRequiredService<DatabaseSeeder>();
        var isDevelopment = app.Environment.IsDevelopment();

        logger.LogInformation(
            "Seeding data for {Environment} environment...",
            isDevelopment ? "Development" : "Production"
        );

        await seeder.SeedAllAsync(isDevelopment);
        logger.LogInformation("Seed data completed successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while migrating or seeding the database");
        // エラーが発生してもアプリケーションは起動を続行
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Pecus Database Manager API v1");
        options.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
