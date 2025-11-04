using Microsoft.EntityFrameworkCore;
using Pecus.DbManager;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Seed;

var builder = WebApplication.CreateBuilder(args);

// Aspire Service Defaultsの追加
builder.AddServiceDefaults();

// DbContextの登録 - Aspireの接続文字列を使用
builder.AddNpgsqlDbContext<ApplicationDbContext>(
    "pecusdb",
    null,
    optionsBuilder =>
        optionsBuilder.UseNpgsql(npgsqlBuilder =>
            npgsqlBuilder.MigrationsAssembly("pecus.DbManager")
        )
);
// ExecutionStrategyをNonRetryingExecutionStrategyに置き換え
builder.Services.ConfigureDbContext<ApplicationDbContext>(options =>
{
    // NpgsqlRetryingExecutionStrategyを無効化してNonRetryingExecutionStrategyを使用
    options.ReplaceService<Microsoft.EntityFrameworkCore.Storage.IExecutionStrategy, Microsoft.EntityFrameworkCore.Storage.NonRetryingExecutionStrategy>();
});

// DatabaseSeederの登録
builder.Services.AddScoped<DatabaseSeeder>();

// OpenTelemetryの設定
builder
    .Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing.AddSource(DbInitializer.ActivitySourceName));

// DbInitializerをシングルトンとして登録
builder.Services.AddSingleton<DbInitializer>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<DbInitializer>());

// ヘルスチェックの登録
builder.Services.AddHealthChecks().AddCheck<DbInitializerHealthCheck>("DbInitializer", null);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    // 開発環境専用: データベースリセットエンドポイント
    app.MapPost(
        "/reset-db",
        async (
            ApplicationDbContext dbContext,
            DatabaseSeeder seeder,
            DbInitializer dbInitializer,
            CancellationToken cancellationToken
        ) =>
        {
            // データベースを削除して再作成
            await dbContext.Database.EnsureDeletedAsync(cancellationToken);
            await dbInitializer.InitializeDatabaseAsync(dbContext, seeder, cancellationToken);
        }
    );
}

app.MapDefaultEndpoints();

await app.RunAsync();
