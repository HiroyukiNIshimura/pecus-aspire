using Hangfire;
using Hangfire.Redis.StackExchange;
using Pecus.Libs.DB;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Configuration;
using Pecus.Libs.Mail.Services;
using StackExchange.Redis;

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

//ここでは何もしないHangfireクライアントとジョブを実行するサーバーを登録する
builder.Services.AddHangfire(
    (serviceProvider, config) =>
    {
        var redis = serviceProvider.GetRequiredService<IConnectionMultiplexer>();
        config.UseRedisStorage(redis);
    }
);

builder.Services.AddHangfireServer();

var app = builder.Build();
app.Run();
