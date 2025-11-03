using Hangfire;
using Hangfire.Redis.StackExchange;
using Pecus.BackFire;
using Pecus.Libs.DB;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Configuration;
using Pecus.Libs.Mail.Services;

var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();
builder.AddRedisClient("redis");

// DbContextの登録 - ImageTasksで使用
builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb");

// EmailSettings設定
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));

// メール関連サービスの登録
builder.Services.AddScoped<ITemplateService, RazorTemplateService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Hangfireタスクの登録
builder.Services.AddScoped<HangfireTasks>();
builder.Services.AddScoped<EmailTasks>();
builder.Services.AddScoped<ImageTasks>();
builder.Services.AddScoped<RefreshTokenCleanupTasks>();

//ここでは何もしないHangfireクライアントとジョブを実行するサーバーを登録する
builder.Services.AddHangfire(
    (serviceProvider, config) =>
    {
        var redis = builder.Configuration.GetConnectionString("redis");
        config.UseRedisStorage(redis, new RedisStorageOptions { Prefix = "hangfire:" });
    }
);

builder.Services.AddHangfireServer();

var app = builder.Build();

// Hangfireダッシュボード（開発環境のみ）
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard(
        "/hangfire",
        new DashboardOptions
        {
            Authorization = new[] { new AllowAllDashboardAuthorizationFilter() },
        }
    );
}

//RefreshTokenCleanupTasksの定期実行設定
// 設定からバッチサイズと古いトークンの保持期間を取得
var cleanupSection = builder.Configuration.GetSection("RefreshTokenCleanup");
var cleanupBatchSize = cleanupSection.GetValue<int?>("BatchSize") ?? 1000;
var cleanupOlderThanDays = cleanupSection.GetValue<int?>("OlderThanDays") ?? 30;
// Cron の時刻を設定から取得（デフォルト: 毎日 02:00）
var cleanupHour = cleanupSection.GetValue<int?>("Hour") ?? 2;
var cleanupMinute = cleanupSection.GetValue<int?>("Minute") ?? 0;
// 値の範囲を安全にクリップ
cleanupHour = System.Math.Clamp(cleanupHour, 0, 23);
cleanupMinute = System.Math.Clamp(cleanupMinute, 0, 59);

RecurringJob.AddOrUpdate<RefreshTokenCleanupTasks>(
    "RefreshTokenCleanup",
    task => task.CleanupExpiredTokensAsync(cleanupBatchSize, cleanupOlderThanDays),
    Cron.Daily(cleanupHour, cleanupMinute) // 設定で指定した時刻に実行
);

app.Run();
