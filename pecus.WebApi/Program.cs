using Hangfire;
using Hangfire.Redis.StackExchange;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Pecus.Filters;
using Pecus.Hubs;
using Pecus.Libs;
using Pecus.Libs.AI.Extensions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Services;
using Pecus.Libs.Focus;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Hangfire.Tasks.Bot.Extensions;
using Pecus.Libs.Information;
using Pecus.Libs.Lexical;
using Pecus.Libs.Mail.Services;
using Pecus.Libs.Security;
using Pecus.Libs.Statistics.Extensions;
using Pecus.Models.Config;
using Pecus.OpenApi;
using Pecus.Services;
using StackExchange.Redis;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

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

// Pecus設定の読み込みと登録
var pecusConfig = builder.Configuration.GetSection("Pecus").Get<PecusConfig>() ?? new PecusConfig();
// DataPaths:Uploads から StoragePath を設定（環境変数 DataPaths__Uploads 経由）
var uploadsPath = builder.Configuration["DataPaths:Uploads"];
if (!string.IsNullOrEmpty(uploadsPath))
{
    pecusConfig.FileUpload.StoragePath = uploadsPath;
}
builder.Services.AddSingleton(pecusConfig);

// JwtBearerUtilを初期化
JwtBearerUtil.Initialize(pecusConfig);

// HttpContextAccessorを追加（動的BaseUrl取得用）
builder.Services.AddHttpContextAccessor();

// Add services to the container.

// DbContextの登録 - Aspireの接続文字列を使用
builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb");
// ExecutionStrategyをNonRetryingExecutionStrategyに置き換え
builder.Services.ConfigureDbContext<ApplicationDbContext>(options =>
{
    // NpgsqlRetryingExecutionStrategyを無効化してNonRetryingExecutionStrategyを使用
    options.ReplaceService<Microsoft.EntityFrameworkCore.Storage.IExecutionStrategy, Microsoft.EntityFrameworkCore.Storage.NonRetryingExecutionStrategy>();
});

// メール関連サービスの登録
builder.Services.AddSingleton<RazorTemplateService>();
builder.Services.AddSingleton<ITemplateService>(sp => sp.GetRequiredService<RazorTemplateService>());
builder.Services.AddSingleton<RazorNonEncodeTemplateService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// セキュリティ関連サービスの登録
builder.Services.AddSingleton<FrontendUrlResolver>();

// CORS設定（開発環境のみ - SignalR用）
// 本番環境ではリバースプロキシ経由で同一ドメインになるためCORS不要
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("SignalRPolicy", policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "https://localhost:3000"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials(); // SignalR に必要
        });
    });
}

// Redisキャッシュの登録
builder.AddRedisClient("redis");
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 10000;          // 最大エントリ数
    options.CompactionPercentage = 0.25; // 制限超過時に25%を圧縮
});

// SignalR + Redis バックプレーンの登録
// Aspire 経由で Redis 接続文字列を取得
var redisConnectionString = builder.Configuration.GetConnectionString("redis") ?? "localhost:6379";

// SignalR + Redis バックプレーン
builder.Services.AddSignalR(options =>
    {
        // KeepAlive間隔（デフォルト: 15秒）
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
        // クライアントタイムアウト（デフォルト: 30秒、KeepAliveの2倍推奨）
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
        // ハンドシェイクタイムアウト
        options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    })
   .AddStackExchangeRedis(redisConnectionString, options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal("coati-signalr");
    });

// ヘルパーの登録
builder.Services.AddScoped<OrganizationAccessHelper>();

// Libs の共通サービスの登録
builder.Services.AddScoped<BatchOrganizationDeletionService>();

// サービスの登録
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<EmailChangeService>();
builder.Services.AddScoped<RoleService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<OrganizationService>();
builder.Services.AddScoped<BackOfficeOrganizationService>();
builder.Services.AddScoped<SystemNotificationService>();
builder.Services.AddScoped<WorkspaceService>();
builder.Services.AddScoped<WorkspaceItemService>();
builder.Services.AddScoped<WorkspaceItemAttachmentService>();
builder.Services.AddScoped<WorkspaceItemTempAttachmentService>();
builder.Services.AddScoped<WorkspaceItemPinService>();
builder.Services.AddScoped<WorkspaceItemTagService>();
builder.Services.AddScoped<WorkspaceItemRelationService>();
builder.Services.AddScoped<WorkspaceTaskService>();
builder.Services.AddScoped<TaskCommentService>();
builder.Services.AddScoped<GenreService>();
builder.Services.AddScoped<FileUploadService>();
builder.Services.AddScoped<TagService>();
builder.Services.AddScoped<SkillService>();
builder.Services.AddScoped<MasterDataService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<ActivityService>();
builder.Services.AddStatistics();
builder.Services.AddBotTaskGuard();
builder.Services.AddScoped<DashboardStatisticsService>();
builder.Services.AddScoped<HealthAnalysisService>();
builder.Services.AddScoped<IFocusTaskProvider, FocusTaskProvider>();
builder.Services.AddScoped<IInformationSearchProvider, InformationSearchProvider>();
builder.Services.AddScoped<FocusRecommendationService>();
builder.Services.AddScoped<ChatRoomService>();
builder.Services.AddScoped<ChatMessageService>();
builder.Services.AddScoped<BotMessageService>();
builder.Services.AddScoped<DocumentSuggestionService>();
builder.Services.AddScoped<TaskContentSuggestionService>();
builder.Services.AddScoped<TaskGenerationService>();
builder.Services.AddScoped<IAiAssistantService, AiAssistantService>();
builder.Services.AddScoped<AchievementService>();
builder.Services.AddScoped<AgendaService>();
builder.Services.AddScoped<AgendaNotificationService>();

// トークン管理サービス（プロトタイプ、メモリキャッシュベース）
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddSingleton<TokenBlacklistService>();

// SignalR プレゼンスサービス（Redis ベース、スケールアウト対応）
builder.Services.AddSingleton<SignalRPresenceService>();

// SignalR 通知サブスクライバー（Redis Pub/Sub → SignalR 転送）
builder.Services.AddHostedService<SignalRNotificationSubscriber>();

// Lexical Converter gRPC サービスの登録
var lexicalConverterEndpoint = builder.Configuration["LexicalConverter:Endpoint"] ?? "http://localhost:5100";
var lexicalConverterApiKey = builder.Configuration["LexicalConverter:GrpcApiKey"] ?? "";
builder.Services.AddSingleton<ILexicalConverterService>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<LexicalConverterService>>();
    return new LexicalConverterService(lexicalConverterEndpoint, lexicalConverterApiKey, logger);
});

// Hangfireタスクの登録
builder.Services.AddScoped<EmailTasks>();
builder.Services.AddScoped<ImageTasks>();
builder.Services.AddScoped<WorkspaceItemTasks>();

// Hangfireの設定
builder.Services.AddHangfire(
    (serviceProvider, configuration) =>
    {
        var redis = builder.Configuration.GetConnectionString("redis");
        configuration
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseRedisStorage(redis, new RedisStorageOptions { Prefix = "hangfire:", Db = 1 });
    }
);

builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;

        // 環境変数から取得、なければ appsettings.json から
        var signingKey = Environment.GetEnvironmentVariable("JWT_SECRET")
                         ?? pecusConfig.Jwt.IssuerSigningKey;

        // キーの長さ検証（最低32バイト）
        var keyBytes = Encoding.UTF8.GetBytes(signingKey);
        if (keyBytes.Length < 32)
        {
            throw new InvalidOperationException(
                $"JWT署名キーが短すぎます（現在: {keyBytes.Length}バイト、最低: 32バイト）。" +
                "appsettings.json の Pecus:Jwt:IssuerSigningKey を64文字以上の文字列に変更してください。"
            );
        }

        options.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ValidateIssuer = true,
            ValidIssuer = pecusConfig.Jwt.ValidIssuer,
            ValidateAudience = true,
            ValidAudience = pecusConfig.Jwt.ValidAudience,
            RequireExpirationTime = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(pecusConfig.Jwt.ExpiresMinutes),
        };

        // トークン検証時にブラックリストを参照して即時拒否する（ログを追加）
        options.Events = new JwtBearerEvents
        {
            // リクエスト受信時にトークンヘッダーの有無やリクエストパスをログ出力
            // SignalR の WebSocket 接続時はクエリパラメータからトークンを取得
            OnMessageReceived = context =>
            {
                try
                {
                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    var hasAuthHeader = context.Request.Headers.ContainsKey("Authorization");
                    logger?.LogDebug("JwtBearer: MessageReceived Path={Path} HasAuthorizationHeader={HasAuth}", context.HttpContext.Request.Path, hasAuthHeader);

                    // SignalR Hub へのリクエストの場合、クエリパラメータからトークンを取得
                    var path = context.HttpContext.Request.Path;
                    if (path.StartsWithSegments("/hubs"))
                    {
                        var accessToken = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(accessToken))
                        {
                            context.Token = accessToken;
                            logger?.LogDebug("JwtBearer: SignalR token extracted from query parameter");
                        }
                    }
                }
                catch { /* ログ失敗してもトークン処理は継続 */ }

                return Task.CompletedTask;
            },

            // 認証失敗時に例外情報を詳細ログとして残す
            OnAuthenticationFailed = context =>
            {
                try
                {
                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    logger?.LogError(context.Exception, "JwtBearer: Authentication failed for request {Path}", context.HttpContext.Request.Path);
                }
                catch { /* ログ失敗時は無視 */ }

                return Task.CompletedTask;
            },

            // 認可チャレンジが発生した際のログ
            OnChallenge = context =>
            {
                try
                {
                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    logger?.LogWarning("JwtBearer: Challenge triggered. Error={Error}, Description={Desc}, Path={Path}", context.Error, context.ErrorDescription, context.HttpContext.Request.Path);
                }
                catch { }

                return Task.CompletedTask;
            },

            // トークン検証成功時でもブラックリストチェックの結果や例外はログ出力
            OnTokenValidated = async context =>
            {
                try
                {
                    var principal = context.Principal;
                    if (principal == null)
                    {
                        context.Fail("Invalid principal");
                        return;
                    }

                    // JTI と発行時刻を取得して、Redis 側でまとめて無効化チェックを実行
                    var jti = JwtBearerUtil.GetJtiFromPrincipal(principal);
                    var userId = JwtBearerUtil.GetUserIdFromPrincipal(principal);
                    var iat = JwtBearerUtil.GetIssuedAtFromPrincipal(principal);
                    var blacklist = context.HttpContext.RequestServices.GetRequiredService<TokenBlacklistService>();

                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    if (await blacklist.IsTokenRevokedAsync(userId, iat, jti))
                    {
                        logger?.LogDebug("JwtBearer: Token revoked. UserId={UserId} Jti={Jti} Iat={Iat}", userId, jti, iat);
                        context.Fail("Token has been revoked or invalidated");
                        return;
                    }

                    // ユーザーが無効な場合はトークンを拒否
                    var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
                    if (user == null || !user.IsActive)
                    {
                        logger?.LogDebug("JwtBearer: User is inactive or not found. UserId={UserId}", userId);
                        context.Fail("User is inactive or not found");
                        return;
                    }

                    logger?.LogDebug("JwtBearer: Token validated. UserId={UserId} Jti={Jti} Iat={Iat}", userId, jti, iat);
                }
                catch (Exception ex)
                {
                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    logger?.LogError(ex, "Error during token validation events");
                    context.Fail("Token validation error");
                }
            }
        };
    });

builder.Services.AddControllers(options =>
{
    // グローバル例外ハンドリングフィルターを追加
    options.Filters.Add<GlobalExceptionFilter>();
    // 共通の検証フィルターを追加
    options.Filters.Add<ValidationFilter>();
    // グローバル認証ポリシーを追加
    options.Filters.Add(new Microsoft.AspNetCore.Mvc.Authorization.AuthorizeFilter());
}).AddJsonOptions(opts =>
    {
        // レスポンスは camelCase（先頭小文字）でシリアライズ
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        // リクエスト側は大文字小文字を無視してマッピング（PascalCase のプロパティ名も許可）
        opts.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        // Enumを文字列としてシリアライズ/デシリアライズ
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// OpenAPIの設定 (Microsoft.AspNetCore.OpenApi)
// OpenAPI 3.0 に固定（3.1 では nullable や integer の扱いが異なるため）
builder.Services.AddOpenApi("v1", options =>
{
    //本プロジェクトでは恒久的に変更禁止
    options.OpenApiVersion = OpenApiSpecVersion.OpenApi3_0;

    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info = new OpenApiInfo
        {
            Title = pecusConfig.Application.Name,
            Version = pecusConfig.Application.Version,
            Description = "AIを社畜扱いして作成するWebAPIです。",
        };
        return Task.CompletedTask;
    });

    // JWT Bearer認証のセキュリティスキーム設定
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();

    // 整数型を integer のみに統一（integer | string のユニオン型を防止）
    options.AddSchemaTransformer<IntegerSchemaTransformer>();

    // Enum を文字列として出力
    options.AddSchemaTransformer<EnumSchemaTransformer>();
});

// HttpLoggingの設定
builder.Services.AddHttpLogging(logging =>
{
    logging.LoggingFields = Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.All;
    logging.RequestBodyLogLimit = 4096;
    logging.ResponseBodyLogLimit = 4096;
});

// AI クライアントの登録（APIキーが設定されているプロバイダーのみ有効化）
builder.Services.AddOpenAIClient(builder.Configuration);
builder.Services.AddAnthropicClient(builder.Configuration);
builder.Services.AddDeepSeekClient(builder.Configuration);
builder.Services.AddGeminiClient(builder.Configuration);
builder.Services.AddKimiClient(builder.Configuration);
builder.Services.AddDefaultAiClient(builder.Configuration);
builder.Services.AddAiClientFactory();
//-------------
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/openapi/v1.json",
            $"{pecusConfig.Application.Name} {pecusConfig.Application.Version}"
        );
        options.RoutePrefix = string.Empty;
    });
}

app.UseHttpLogging();
app.UseHttpsRedirection();

// CORS（開発環境のみ - SignalR用）
if (app.Environment.IsDevelopment())
{
    app.UseCors("SignalRPolicy");
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
// SignalR Hub エンドポイント
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapDefaultEndpoints();

app.Run();