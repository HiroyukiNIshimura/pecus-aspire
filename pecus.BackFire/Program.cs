using Hangfire;
using Pecus.BackFire;
using Pecus.BackFire.Services;
using Pecus.Libs;
using Pecus.Libs.AI.Extensions;
using Pecus.Libs.DB;
using Pecus.Libs.Focus;
using Pecus.Libs.Hangfire.Tasks.Bot.Behaviors.Extensions;
using Pecus.Libs.Hangfire.Tasks.Bot.Extensions;
using Pecus.Libs.Hangfire.Tasks.Extensions;
using Pecus.Libs.Hangfire.Tasks.Services;
using Pecus.Libs.Information;
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

if (builder.Environment.IsProduction())
{
    // Aspire Service Defaults (Serilog含む)
    builder.AddServiceDefaults(SerilogHelper.LogEnvironment.Production);
}
else
{
    builder.AddServiceDefaults(SerilogHelper.LogEnvironment.Development);
}

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
// ApplicationSettings設定（メールテンプレート用）
builder.Services.Configure<ApplicationSettings>(
    builder.Configuration.GetSection("Pecus:Application"));

// メール関連サービスの登録
builder.Services.AddSingleton<RazorTemplateService>();
builder.Services.AddSingleton<RazorNonEncodeTemplateService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// FrontendUrlResolver の登録
builder.Services.AddSingleton<FrontendUrlResolver>();
// メッセージ解析サービスの登録
builder.Services.AddMessageAnalyzer();
// BotSelector の登録
builder.Services.AddBotSelector();
// BotBehaviors の登録（振る舞いプラグインシステム）
builder.Services.AddBotBehaviors();
// FocusTaskProvider の登録（やることリスト取得）
builder.Services.AddScoped<IFocusTaskProvider, FocusTaskProvider>();
// InformationSearchProvider の登録（情報検索）
builder.Services.AddScoped<IInformationSearchProvider, InformationSearchProvider>();
// AI Tools の登録（MCP的なツールベースアーキテクチャ）
builder.Services.AddAiTools();

// Lexical Converter gRPC サービスの登録
var lexicalConverterEndpoint = builder.Configuration["LexicalConverter:Endpoint"] ?? "http://localhost:5100";
var lexicalConverterApiKey = builder.Configuration["LexicalConverter:GrpcApiKey"] ?? "";
builder.Services.AddSingleton<ILexicalConverterService>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<LexicalConverterService>>();
    return new LexicalConverterService(lexicalConverterEndpoint, lexicalConverterApiKey, logger);
});

// SignalR 通知パブリッシャー（Redis Pub/Sub 経由で WebApi に通知を送信）
builder.Services.AddSingleton<SignalRNotificationPublisher>();
// 類似タスク担当者推薦サービスの登録
builder.Services.AddScoped<ITaskAssignmentSuggester, TaskAssignmentSuggester>();
// 日付抽出サービスの登録
builder.Services.AddScoped<IDateExtractor, DateExtractor>();

// AI クライアントの登録（APIキーが設定されているプロバイダーのみ有効化）
builder.Services.AddOpenAIClient(builder.Configuration);
builder.Services.AddAnthropicClient(builder.Configuration);
builder.Services.AddDeepSeekClient(builder.Configuration);
builder.Services.AddGeminiClient(builder.Configuration);
builder.Services.AddDefaultAiClient(builder.Configuration);
builder.Services.AddAiClientFactory();

// Hangfireタスクの登録
builder.Services.AddHangfireTasks();

// 週間レポート関連サービスの登録
builder.Services.AddWeeklyReportServices();


//ここでは何もしないHangfireクライアントとジョブを実行するサーバーを登録する
var redisConnectionString = builder.Configuration.GetConnectionString("redis");
var redisStorage = new Hangfire.Redis.StackExchange.RedisStorage(
    redisConnectionString,
    new Hangfire.Redis.StackExchange.RedisStorageOptions { Prefix = "hangfire:", Db = 1 }
);

builder.Services.AddHangfire(
    (serviceProvider, config) =>
    {
        config.UseStorage(redisStorage);
    }
);

// JobStorage.Current を設定（RecurringJob 静的メソッド用）
Hangfire.JobStorage.Current = redisStorage;

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

// 週間レポートジョブの設定
WeeklyReportJobScheduler.ConfigureWeeklyReportJob(builder.Configuration);

// システム通知配信ジョブの設定（DBベース）
SystemNotificationJobScheduler.ConfigureSystemNotificationJob(builder.Configuration);

app.Run();