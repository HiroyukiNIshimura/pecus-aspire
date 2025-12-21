using Hangfire;
using Hangfire.Redis.StackExchange;
using Pecus.BackFire;
using Pecus.BackFire.Services;
using Pecus.Libs.AI.Extensions;
using Pecus.Libs.DB;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Hangfire.Tasks.Bot;
using Pecus.Libs.Lexical;
using Pecus.Libs.Mail.Configuration;
using Pecus.Libs.Mail.Services;
using Pecus.Libs.Notifications;
using Pecus.Libs.Security;

#if DEBUG
// Windows環境でデバッグの場合LexicalConverterのgRPCサービスに接続できない問題の対処
// HTTP/2非暗号化通信(h2c)を有効化
AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);
#endif

var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();
builder.AddRedisClient("redis");

// DbContextの登録
builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb");

// ExecutionStrategyをNonRetryingExecutionStrategyに置き換え
builder.Services.ConfigureDbContext<ApplicationDbContext>(options =>
{
    // NpgsqlRetryingExecutionStrategyを無効化してNonRetryingExecutionStrategyを使用
    options.ReplaceService<Microsoft.EntityFrameworkCore.Storage.IExecutionStrategy, Microsoft.EntityFrameworkCore.Storage.NonRetryingExecutionStrategy>();
});

// EmailSettings設定
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));

// メール関連サービスの登録
builder.Services.AddSingleton<RazorTemplateService>();
builder.Services.AddSingleton<RazorNonEncodeTemplateService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// FrontendUrlResolver の登録
builder.Services.AddSingleton<FrontendUrlResolver>();

// Lexical Converter gRPC サービスの登録
var lexicalConverterEndpoint = builder.Configuration["LexicalConverter:Endpoint"] ?? "http://localhost:5100";
builder.Services.AddSingleton<ILexicalConverterService>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<LexicalConverterService>>();
    return new LexicalConverterService(lexicalConverterEndpoint, logger);
});

// SignalR 通知パブリッシャー（Redis Pub/Sub 経由で WebApi に通知を送信）
builder.Services.AddSingleton<SignalRNotificationPublisher>();

// AI クライアントの登録（AiChatReplyTask で使用、APIキーが設定されているプロバイダーのみ有効化）
builder.Services.AddOpenAIClient(builder.Configuration);
builder.Services.AddAnthropicClient(builder.Configuration);
builder.Services.AddDeepSeekClient(builder.Configuration);
builder.Services.AddGeminiClient(builder.Configuration);
builder.Services.AddDefaultAiClient(builder.Configuration);
builder.Services.AddAiClientFactory();

// Hangfireタスクの登録
builder.Services.AddScoped<ActivityTasks>();
builder.Services.AddScoped<HangfireTasks>();
builder.Services.AddScoped<EmailTasks>();
builder.Services.AddScoped<ImageTasks>();
builder.Services.AddScoped<CleanupTasks>();
builder.Services.AddScoped<UploadsCleanupTasks>();
builder.Services.AddScoped<WorkspaceItemTasks>();
builder.Services.AddScoped<FirstTouchdownTask>();
builder.Services.AddScoped<AiChatReplyTask>();

//ここでは何もしないHangfireクライアントとジョブを実行するサーバーを登録する
builder.Services.AddHangfire(
    (serviceProvider, config) =>
    {
        var redis = builder.Configuration.GetConnectionString("redis");
        config.UseRedisStorage(redis, new RedisStorageOptions { Prefix = "hangfire:", Db = 1 });
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

// クリーンアップジョブの設定
CleanupJobScheduler.ConfigureCleanupJobs(builder.Configuration);

app.Run();